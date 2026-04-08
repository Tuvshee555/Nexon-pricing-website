-- ═══════════════════════════════════════════════════════════════
-- NEXON PLATFORM — FULL SUPABASE SCHEMA
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════════════════════════
-- HELPER FUNCTIONS
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ═══════════════════════════════════════════════════════════════
-- TABLES
-- ═══════════════════════════════════════════════════════════════

-- Users table (mirrors auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('admin', 'client')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Businesses
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  platforms TEXT[] NOT NULL DEFAULT '{}',
  bot_prompt TEXT NOT NULL DEFAULT '',
  contact_phone TEXT NOT NULL DEFAULT '',
  contact_email TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Plans
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('monthly', 'credit')),
  monthly_tier TEXT CHECK (monthly_tier IN ('basic', 'standard', 'premium', 'enterprise')),
  monthly_message_limit INTEGER,
  monthly_price INTEGER,
  billing_cycle_start DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Credits
CREATE TABLE IF NOT EXISTS credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL UNIQUE REFERENCES businesses(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0,
  total_purchased INTEGER NOT NULL DEFAULT 0,
  low_credit_alert_active BOOLEAN NOT NULL DEFAULT false,
  low_credit_alert_sent_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Message logs
CREATE TABLE IF NOT EXISTS message_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'messenger')),
  message_count INTEGER NOT NULL DEFAULT 1,
  prompt_tokens INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  credits_used INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'api' CHECK (source IN ('manual', 'api')),
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  credits_added INTEGER NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'qpay' CHECK (payment_method IN ('qpay', 'manual')),
  qpay_invoice_id TEXT,
  qpay_payment_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'cancelled')),
  transaction_type TEXT CHECK (transaction_type IN ('topup', 'subscription', 'message_pack', 'manual')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Platform accounts
CREATE TABLE IF NOT EXISTS platform_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'messenger')),
  external_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (platform, external_id)
);

-- ═══════════════════════════════════════════════════════════════
-- FUNCTIONS
-- ═══════════════════════════════════════════════════════════════

-- Deduct credits with row locking (race condition safe)
CREATE OR REPLACE FUNCTION deduct_credits(
  p_business_id UUID,
  p_credits INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  v_balance INTEGER;
BEGIN
  -- Lock the row
  SELECT balance INTO v_balance
  FROM credits
  WHERE business_id = p_business_id
  FOR UPDATE;

  IF v_balance IS NULL OR v_balance < p_credits THEN
    RETURN FALSE;
  END IF;

  UPDATE credits
  SET
    balance = balance - p_credits,
    updated_at = NOW()
  WHERE business_id = p_business_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add credits
CREATE OR REPLACE FUNCTION add_credits(
  p_business_id UUID,
  p_credits INTEGER
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO credits (business_id, balance, total_purchased)
  VALUES (p_business_id, p_credits, p_credits)
  ON CONFLICT (business_id)
  DO UPDATE SET
    balance = credits.balance + p_credits,
    total_purchased = credits.total_purchased + p_credits,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'client')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Messages used this month for a business
CREATE OR REPLACE FUNCTION get_messages_this_month(p_business_id UUID)
RETURNS INTEGER AS $$
  SELECT COALESCE(SUM(message_count), 0)::INTEGER
  FROM message_logs
  WHERE business_id = p_business_id
    AND logged_at >= DATE_TRUNC('month', NOW());
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Credits used this month for a business
CREATE OR REPLACE FUNCTION get_credits_this_month(p_business_id UUID)
RETURNS INTEGER AS $$
  SELECT COALESCE(SUM(credits_used), 0)::INTEGER
  FROM message_logs
  WHERE business_id = p_business_id
    AND logged_at >= DATE_TRUNC('month', NOW());
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ═══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_accounts ENABLE ROW LEVEL SECURITY;

-- USERS policies
CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (id = auth.uid() OR is_admin());

CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (id = auth.uid() OR is_admin());

CREATE POLICY "users_insert_admin" ON users
  FOR INSERT WITH CHECK (is_admin());

-- BUSINESSES policies
CREATE POLICY "businesses_select" ON businesses
  FOR SELECT USING (
    user_id = auth.uid() OR is_admin()
  );

CREATE POLICY "businesses_insert_admin" ON businesses
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "businesses_update_admin" ON businesses
  FOR UPDATE USING (is_admin());

CREATE POLICY "businesses_delete_admin" ON businesses
  FOR DELETE USING (is_admin());

-- PLANS policies
CREATE POLICY "plans_select" ON plans
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM businesses b
      WHERE b.id = plans.business_id
        AND (b.user_id = auth.uid() OR is_admin())
    )
  );

CREATE POLICY "plans_write_admin" ON plans
  FOR ALL USING (is_admin());

-- CREDITS policies
CREATE POLICY "credits_select" ON credits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM businesses b
      WHERE b.id = credits.business_id
        AND (b.user_id = auth.uid() OR is_admin())
    )
  );

CREATE POLICY "credits_write_admin" ON credits
  FOR ALL USING (is_admin());

-- MESSAGE_LOGS policies
CREATE POLICY "message_logs_select" ON message_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM businesses b
      WHERE b.id = message_logs.business_id
        AND (b.user_id = auth.uid() OR is_admin())
    )
  );

CREATE POLICY "message_logs_insert_service" ON message_logs
  FOR INSERT WITH CHECK (true);

-- TRANSACTIONS policies
CREATE POLICY "transactions_select" ON transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM businesses b
      WHERE b.id = transactions.business_id
        AND (b.user_id = auth.uid() OR is_admin())
    )
  );

CREATE POLICY "transactions_insert" ON transactions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM businesses b
      WHERE b.id = transactions.business_id
        AND (b.user_id = auth.uid() OR is_admin())
    )
  );

CREATE POLICY "transactions_update_admin" ON transactions
  FOR UPDATE USING (is_admin());

-- PLATFORM_ACCOUNTS policies
CREATE POLICY "platform_accounts_select" ON platform_accounts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM businesses b
      WHERE b.id = platform_accounts.business_id
        AND (b.user_id = auth.uid() OR is_admin())
    )
  );

CREATE POLICY "platform_accounts_write_admin" ON platform_accounts
  FOR ALL USING (is_admin());

-- Allow service role to bypass RLS for webhook
-- (Service role key bypasses RLS automatically in Supabase)

-- ═══════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_businesses_user_id ON businesses(user_id);
CREATE INDEX IF NOT EXISTS idx_plans_business_id ON plans(business_id);
CREATE INDEX IF NOT EXISTS idx_credits_business_id ON credits(business_id);
CREATE INDEX IF NOT EXISTS idx_message_logs_business_id ON message_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_message_logs_logged_at ON message_logs(logged_at);
CREATE INDEX IF NOT EXISTS idx_transactions_business_id ON transactions(business_id);
CREATE INDEX IF NOT EXISTS idx_platform_accounts_external ON platform_accounts(platform, external_id);
