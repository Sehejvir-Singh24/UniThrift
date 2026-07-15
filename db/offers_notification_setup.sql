-- Migration: Add notification tracking columns to public.offers table
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS seller_notified BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS buyer_notified BOOLEAN DEFAULT false NOT NULL;
