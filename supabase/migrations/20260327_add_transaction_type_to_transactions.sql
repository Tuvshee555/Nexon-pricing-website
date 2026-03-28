ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS transaction_type TEXT
  CHECK (transaction_type IN ('topup', 'subscription', 'message_pack', 'manual'));

UPDATE public.transactions
SET transaction_type = 'message_pack'
WHERE transaction_type IS NULL
  AND payment_method = 'qpay'
  AND credits_added > 0;

UPDATE public.transactions
SET transaction_type = 'topup'
WHERE transaction_type IS NULL
  AND payment_method = 'qpay'
  AND credits_added = 0;

UPDATE public.transactions
SET transaction_type = 'manual'
WHERE transaction_type IS NULL
  AND payment_method = 'manual';
