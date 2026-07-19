-- Add images and amenities columns to roommate_listings
ALTER TABLE public.roommate_listings
  ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS amenities TEXT[] DEFAULT '{}';
