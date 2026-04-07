-- ═══════════════════════════════════════════════════════════════
-- NEXON PLATFORM — NEONDB SCHEMA
-- Run this in the NeonDB SQL Editor to create all tables
-- ═══════════════════════════════════════════════════════════════

-- Users (replaces Supabase auth + users table)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT '',
  password_hash TEXT,
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('admin', 'client')),
  reset_token TEXT,
  reset_token_expires TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Businesses
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  platforms TEXT[] NOT NULL DEFAULT '{}',
  bot_prompt TEXT NOT NULL DEFAULT '',
  contact_phone TEXT NOT NULL DEFAULT '',
  contact_email TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
  virtual_balance INTEGER NOT NULL DEFAULT 0,
  subscription_price INTEGER NOT NULL DEFAULT 0,
  next_billing_date TIMESTAMPTZ,
  billing_active BOOLEAN NOT NULL DEFAULT false,
  onboarding_step INTEGER NOT NULL DEFAULT 0,
  onboarding_done BOOLEAN NOT NULL DEFAULT false,
  bot_name TEXT NOT NULL DEFAULT 'Nexon Bot',
  welcome_message TEXT NOT NULL DEFAULT '',
  bot_tone TEXT NOT NULL DEFAULT 'friendly' CHECK (bot_tone IN ('friendly','formal','professional','casual')),
  business_type TEXT NOT NULL DEFAULT 'other',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Plans
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL UNIQUE REFERENCES businesses(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0,
  total_purchased INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Message logs
CREATE TABLE IF NOT EXISTS message_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Platform accounts (Facebook pages / Instagram accounts per business)
CREATE TABLE IF NOT EXISTS platform_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'messenger')),
  external_id TEXT NOT NULL,
  page_access_token TEXT,
  page_name TEXT NOT NULL DEFAULT '',
  page_id TEXT,
  instagram_account_id TEXT,
  token_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (platform, external_id)
);

-- Conversation threads (chat history per sender)
CREATE TABLE IF NOT EXISTS conversation_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'messenger')),
  sender_id TEXT NOT NULL,
  messages JSONB NOT NULL DEFAULT '[]',
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (business_id, platform, sender_id)
);

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id),
  action TEXT NOT NULL,
  business_id UUID REFERENCES businesses(id),
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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
CREATE INDEX IF NOT EXISTS idx_platform_accounts_page_id ON platform_accounts(page_id);
CREATE INDEX IF NOT EXISTS idx_conv_threads_business ON conversation_threads(business_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_businesses_billing ON businesses(billing_active, next_billing_date) WHERE billing_active = true;

-- ═══════════════════════════════════════════════════════════════
-- INITIAL ADMIN USER (change the password!)
-- Run this after creating the schema:
--
-- INSERT INTO users (email, name, password_hash, role)
-- VALUES ('admin@nexon.mn', 'Admin', '<bcrypt_hash>', 'admin');
--
-- To generate a bcrypt hash, use: https://bcrypt-generator.com/
-- or run: node -e "const b=require('bcryptjs');b.hash('yourpassword',10).then(console.log)"
-- ═══════════════════════════════════════════════════════════════
