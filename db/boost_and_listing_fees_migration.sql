-- Boost and Listing Fees Migration for UniThrift Marketplace

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS is_boosted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS boosted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS listing_fee_paid DECIMAL DEFAULT 0;

-- Index for fast boosted products lookup on Home page
CREATE INDEX IF NOT EXISTS idx_products_boosted ON public.products(is_boosted, created_at DESC);
