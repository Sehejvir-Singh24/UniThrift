-- UniMatch Setup & Schema Migration
-- Run this script in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Add UniMatch columns to public.profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS instagram_username TEXT,
  ADD COLUMN IF NOT EXISTS major TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS gender TEXT,
  ADD COLUMN IF NOT EXISTS preferred_gender TEXT,
  ADD COLUMN IF NOT EXISTS looking_for TEXT DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS interests TEXT DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS profile_photos TEXT DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS unimatch_profile_complete BOOLEAN DEFAULT FALSE;

-- 2. Create unimatch_likes table for swiping logic
CREATE TABLE IF NOT EXISTS public.unimatch_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  liker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  liked_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  action TEXT CHECK (action IN ('like', 'pass')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(liker_id, liked_user_id)
);

-- Enable Row Level Security (RLS) on unimatch_likes
ALTER TABLE public.unimatch_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own likes" ON public.unimatch_likes;
CREATE POLICY "Users can view their own likes"
  ON public.unimatch_likes FOR SELECT
  TO authenticated
  USING ( auth.uid() = liker_id OR auth.uid() = liked_user_id );

DROP POLICY IF EXISTS "Users can insert their own likes" ON public.unimatch_likes;
CREATE POLICY "Users can insert their own likes"
  ON public.unimatch_likes FOR INSERT
  TO authenticated
  WITH CHECK ( auth.uid() = liker_id );

DROP POLICY IF EXISTS "Users can delete their own likes" ON public.unimatch_likes;
CREATE POLICY "Users can delete their own likes"
  ON public.unimatch_likes FOR DELETE
  TO authenticated
  USING ( auth.uid() = liker_id );

-- 3. Create unimatch_matches table for mutual matches
CREATE TABLE IF NOT EXISTS public.unimatch_matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  user2_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  icebreaker_completed BOOLEAN DEFAULT FALSE,
  insta_shared_user1 BOOLEAN DEFAULT FALSE,
  insta_shared_user2 BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user1_id, user2_id)
);

-- Enable RLS on unimatch_matches
ALTER TABLE public.unimatch_matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their matches" ON public.unimatch_matches;
CREATE POLICY "Users can view their matches"
  ON public.unimatch_matches FOR SELECT
  TO authenticated
  USING ( auth.uid() = user1_id OR auth.uid() = user2_id );

DROP POLICY IF EXISTS "Users can update their matches" ON public.unimatch_matches;
CREATE POLICY "Users can update their matches"
  ON public.unimatch_matches FOR UPDATE
  TO authenticated
  USING ( auth.uid() = user1_id OR auth.uid() = user2_id );

DROP POLICY IF EXISTS "Users can insert their matches" ON public.unimatch_matches;
CREATE POLICY "Users can insert their matches"
  ON public.unimatch_matches FOR INSERT
  TO authenticated
  WITH CHECK ( auth.uid() = user1_id OR auth.uid() = user2_id );

-- 4. Create storage bucket for profile photos (if not existing)
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile_photos', 'profile_photos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for storage bucket
DROP POLICY IF EXISTS "Public access to profile_photos" ON storage.objects;
CREATE POLICY "Public access to profile_photos"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'profile_photos' );

DROP POLICY IF EXISTS "Authenticated users can upload profile_photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload profile_photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK ( bucket_id = 'profile_photos' );
