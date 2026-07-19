-- Roommate Two-Sided Marketplace Update
-- Run this in your Supabase SQL Editor

ALTER TABLE public.roommate_listings
  ADD COLUMN IF NOT EXISTS listing_type TEXT DEFAULT 'need_flat', -- 'need_flat' or 'have_flat'
  ADD COLUMN IF NOT EXISTS rent DECIMAL;

ALTER TABLE public.roommate_listings ALTER COLUMN budget DROP NOT NULL;
