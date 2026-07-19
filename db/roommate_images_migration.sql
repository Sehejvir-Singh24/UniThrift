-- Add images and amenities columns to roommate_listings
ALTER TABLE public.roommate_listings
  ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS amenities TEXT[] DEFAULT '{}';

-- Create the roommate_images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('roommate_images', 'roommate_images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for the bucket (dropping first to avoid conflicts if re-run)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;

CREATE POLICY "Public Access"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'roommate_images' );

CREATE POLICY "Authenticated users can upload images"
  ON storage.objects FOR INSERT
  WITH CHECK ( bucket_id = 'roommate_images' AND auth.role() = 'authenticated' );

CREATE POLICY "Users can update own images"
  ON storage.objects FOR UPDATE
  USING ( auth.uid() = owner AND bucket_id = 'roommate_images' );

CREATE POLICY "Users can delete own images"
  ON storage.objects FOR DELETE
  USING ( auth.uid() = owner AND bucket_id = 'roommate_images' );
