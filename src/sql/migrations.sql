-- ============================================================
-- Nexon Platform — Database Migrations
-- Run these in your Supabase SQL Editor
-- ============================================================

-- 1. Add virtual balance columns to businesses table
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS virtual_balance    INTEGER       DEFAULT 0,
  ADD COLUMN IF NOT EXISTS subscription_price INTEGER       DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_billing_date  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS billing_active     BOOLEAN       DEFAULT false;

-- 1b. Add low-credit alert state columns
ALTER TABLE public.credits
  ADD COLUMN IF NOT EXISTS low_credit_alert_active BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS low_credit_alert_sent_at TIMESTAMPTZ;

-- 2. Add transaction_type to transactions table
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS transaction_type TEXT
    CHECK (transaction_type IN ('topup', 'subscription', 'message_pack', 'manual'));

-- 3. Set transaction_type for existing rows
UPDATE public.transactions
  SET transaction_type = 'message_pack'
  WHERE transaction_type IS NULL AND payment_method = 'qpay';

UPDATE public.transactions
  SET transaction_type = 'manual'
  WHERE transaction_type IS NULL AND payment_method = 'manual';

-- 4. Index for billing cron query
CREATE INDEX IF NOT EXISTS idx_businesses_billing
  ON public.businesses (billing_active, next_billing_date)
  WHERE billing_active = true;

-- 5. Create add_credits function (safe upsert with row locking)
CREATE OR REPLACE FUNCTION public.add_credits(
  p_business_id UUID,
  p_credits INTEGER
)
RETURNS VOID AS $$
BEGIN
  -- Try to update existing row with row lock
  UPDATE public.credits
    SET balance = balance + p_credits,
        total_purchased = total_purchased + p_credits
    WHERE business_id = p_business_id;

  -- If no row existed, insert one
  IF NOT FOUND THEN
    INSERT INTO public.credits (business_id, balance, total_purchased)
    VALUES (p_business_id, p_credits, p_credits);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create deduct_credits function with row locking for race safety
CREATE OR REPLACE FUNCTION public.deduct_credits(
  p_business_id UUID,
  p_credits INTEGER
)
RETURNS INTEGER AS $$
DECLARE
  v_balance INTEGER;
BEGIN
  SELECT balance INTO v_balance
    FROM public.credits
    WHERE business_id = p_business_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  IF v_balance < p_credits THEN
    RETURN v_balance;
  END IF;

  UPDATE public.credits
    SET balance = balance - p_credits
    WHERE business_id = p_business_id;

  RETURN v_balance - p_credits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Atomic virtual balance increment (avoids race conditions)
CREATE OR REPLACE FUNCTION public.increment_virtual_balance(
  p_business_id UUID,
  p_amount INTEGER
)
RETURNS INTEGER AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  UPDATE public.businesses
    SET virtual_balance = virtual_balance + p_amount
    WHERE id = p_business_id
    RETURNING virtual_balance INTO v_new_balance;

  RETURN COALESCE(v_new_balance, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. is_admin helper function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 9. RLS policies — admin can see all users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'admin_select_all_users' AND tablename = 'users'
  ) THEN
    CREATE POLICY admin_select_all_users ON public.users
      FOR SELECT USING (is_admin() OR id = auth.uid());
  END IF;
END $$;

-- 10. RLS — service role can always update credits
-- (service role bypasses RLS by default, but this ensures anon/authenticated can read own)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'users_read_own_credits' AND tablename = 'credits'
  ) THEN
    CREATE POLICY users_read_own_credits ON public.credits
      FOR SELECT USING (
        business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
        OR is_admin()
      );
  END IF;
END $$;

-- ============================================================
-- SELF-SERVICE PLATFORM MIGRATIONS (ManyChat-like)
-- Run these after the migrations above
-- ============================================================

-- A. Extend businesses for self-service onboarding
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS onboarding_step   INTEGER  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS onboarding_done   BOOLEAN  NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS bot_name          TEXT     NOT NULL DEFAULT 'Nexon Bot',
  ADD COLUMN IF NOT EXISTS welcome_message   TEXT     NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS bot_tone          TEXT     NOT NULL DEFAULT 'friendly'
    CHECK (bot_tone IN ('friendly','formal','professional','casual')),
  ADD COLUMN IF NOT EXISTS business_type     TEXT     NOT NULL DEFAULT 'other';

-- Mark only already-configured admin-created businesses as onboarding complete.
-- Empty/paused placeholder rows should still go through self-service setup.
UPDATE public.businesses SET onboarding_done = true, onboarding_step = 5
WHERE onboarding_done = false
  AND status <> 'paused'
  AND NULLIF(TRIM(bot_prompt), '') IS NOT NULL
  AND COALESCE(array_length(platforms, 1), 0) > 0;

-- B. Extend platform_accounts for per-business FB tokens
ALTER TABLE public.platform_accounts
  ADD COLUMN IF NOT EXISTS page_access_token    TEXT,
  ADD COLUMN IF NOT EXISTS page_name            TEXT     NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS page_id              TEXT,
  ADD COLUMN IF NOT EXISTS instagram_account_id TEXT,
  ADD COLUMN IF NOT EXISTS token_expires_at     TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_platform_accounts_page_id
  ON public.platform_accounts(page_id);

-- C. Conversation threads table for chat history
CREATE TABLE IF NOT EXISTS public.conversation_threads (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id     UUID        NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  platform        TEXT        NOT NULL CHECK (platform IN ('instagram','messenger')),
  sender_id       TEXT        NOT NULL,
  messages        JSONB       NOT NULL DEFAULT '[]',
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(business_id, platform, sender_id)
);
CREATE INDEX IF NOT EXISTS idx_conv_threads_business
  ON public.conversation_threads(business_id, last_message_at DESC);
ALTER TABLE public.conversation_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conv_threads_own" ON public.conversation_threads
  FOR ALL USING (
    EXISTS (SELECT 1 FROM businesses b WHERE b.id = conversation_threads.business_id
      AND (b.user_id = auth.uid() OR is_admin()))
  );

-- D. Fix RLS policies for self-service
DROP POLICY IF EXISTS "businesses_insert_admin" ON businesses;
CREATE POLICY "businesses_insert_self" ON businesses
  FOR INSERT WITH CHECK (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "businesses_update_admin" ON businesses;
CREATE POLICY "businesses_update_own" ON businesses
  FOR UPDATE USING (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "platform_accounts_write_admin" ON platform_accounts;
CREATE POLICY "platform_accounts_write_own" ON platform_accounts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM businesses b WHERE b.id = platform_accounts.business_id
      AND (b.user_id = auth.uid() OR is_admin()))
  );

DROP POLICY IF EXISTS "credits_write_admin" ON credits;
CREATE POLICY "credits_write_own" ON credits
  FOR ALL USING (
    EXISTS (SELECT 1 FROM businesses b WHERE b.id = credits.business_id
      AND (b.user_id = auth.uid() OR is_admin()))
  );

DROP POLICY IF EXISTS "plans_write_admin" ON plans;
CREATE POLICY "plans_write_own" ON plans
  FOR ALL USING (
    EXISTS (SELECT 1 FROM businesses b WHERE b.id = plans.business_id
      AND (b.user_id = auth.uid() OR is_admin()))
  );

-- ============================================================
-- How to set up a client on the monthly plan:
--
-- UPDATE public.businesses SET
--   subscription_price = 89000,
--   billing_active = true,
--   next_billing_date = NOW() + INTERVAL '1 month'
-- WHERE id = '<business_id>';
--
-- Then add initial virtual balance via admin panel.
-- ============================================================
