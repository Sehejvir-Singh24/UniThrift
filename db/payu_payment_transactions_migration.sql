-- PayU payment audit trail and idempotency store. Run after existing migrations.
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  txnid TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('reservation', 'flatmate_unlock', 'boost')),
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  payment_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  completed_at TIMESTAMPTZ
);
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their payment transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "Users can create their payment transactions" ON public.payment_transactions;
CREATE POLICY "Users can view their payment transactions" ON public.payment_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their payment transactions" ON public.payment_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
