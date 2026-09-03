-- Adds lifecycle states used to safely claim and fulfil FamGateway payments once.
ALTER TABLE public.payment_transactions DROP CONSTRAINT IF EXISTS payment_transactions_status_check;
ALTER TABLE public.payment_transactions ADD CONSTRAINT payment_transactions_status_check CHECK (status IN ('pending', 'processing', 'success', 'failed', 'expired', 'manual_review'));
