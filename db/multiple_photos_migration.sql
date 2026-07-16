-- Add image_urls array column to products table to support multiple photos
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_urls TEXT[];
