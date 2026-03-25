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
