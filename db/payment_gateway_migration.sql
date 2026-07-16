-- payment_gateway_migration.sql
-- Run this in your Supabase SQL Editor

-- 1. Add payment_id column to reservations table
ALTER TABLE public.reservations 
  ADD COLUMN IF NOT EXISTS payment_id TEXT;

-- 2. Allow Edge Functions (service role) to bypass RLS for reservations
-- This is needed because Edge Functions create reservations server-side
DROP POLICY IF EXISTS "Service role can insert reservations" ON public.reservations;
CREATE POLICY "Service role can insert reservations"
  ON public.reservations FOR INSERT
  WITH CHECK (true);

-- 3. Allow Edge Functions to update products status
DROP POLICY IF EXISTS "Service role can update product status" ON public.products;
CREATE POLICY "Service role can update product status"
  ON public.products FOR UPDATE
  USING (true)
  WITH CHECK (true);
