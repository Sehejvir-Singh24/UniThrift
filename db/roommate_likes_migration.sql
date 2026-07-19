-- Roommate Likes Migration
-- Run this in your Supabase SQL Editor

-- 1. Add missing columns to roommate_listings
ALTER TABLE public.roommate_listings
  ADD COLUMN IF NOT EXISTS room_type TEXT DEFAULT 'Any',
  ADD COLUMN IF NOT EXISTS move_in_date DATE,
  ADD COLUMN IF NOT EXISTS looking_for_flatmates BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS preferred_gender TEXT DEFAULT 'Any',
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 2. Create roommate_likes table for tracking swipes
CREATE TABLE IF NOT EXISTS public.roommate_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  liker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  liked_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  listing_id UUID REFERENCES public.roommate_listings(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(liker_id, listing_id)
);

-- Enable RLS on roommate_likes
ALTER TABLE public.roommate_likes ENABLE ROW LEVEL SECURITY;

-- Policies: users can see their own likes (to detect mutual matches)
DROP POLICY IF EXISTS "Users can view their own likes" ON public.roommate_likes;
CREATE POLICY "Users can view their own likes"
  ON public.roommate_likes FOR SELECT
  TO authenticated
  USING ( auth.uid() = liker_id OR auth.uid() = liked_user_id );

DROP POLICY IF EXISTS "Users can insert their own likes" ON public.roommate_likes;
CREATE POLICY "Users can insert their own likes"
  ON public.roommate_likes FOR INSERT
  TO authenticated
  WITH CHECK ( auth.uid() = liker_id );

DROP POLICY IF EXISTS "Users can delete their own likes" ON public.roommate_likes;
CREATE POLICY "Users can delete their own likes"
  ON public.roommate_likes FOR DELETE
  TO authenticated
  USING ( auth.uid() = liker_id );
