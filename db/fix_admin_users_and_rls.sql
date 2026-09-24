-- ==============================================================================
-- UNITHRIFT & UNIMATCH: COMPLETE SELF-CONTAINED ADMIN & TABLES SETUP
-- ==============================================================================
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql
--
-- This script:
-- 1. Creates all missing tables safely (IF NOT EXISTS)
-- 2. Ensures all required columns exist on public.profiles
-- 3. Syncs all auth.users into public.profiles (so all users show in the dashboard)
-- 4. Sets up automatic profile creation trigger for new sign-ups
-- 5. Configures Row Level Security (RLS) so admins can read/update/delete any user
-- 6. Installs stored functions for 1-click auto-approve and user/profile deletion
-- ==============================================================================

-- ── 1. SAFELY CREATE TABLES IF NOT ALREADY EXISTING ──────────────────────────

-- Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  role TEXT DEFAULT 'customer',
  is_verified BOOLEAN DEFAULT false,
  full_name TEXT,
  avatar_url TEXT,
  college TEXT,
  major TEXT,
  year_of_study TEXT,
  phone_number TEXT,
  enrollment_number TEXT,
  id_url TEXT,
  verification_status TEXT DEFAULT NULL,
  verification_feedback TEXT DEFAULT NULL,
  instagram_username TEXT DEFAULT NULL,
  bio TEXT DEFAULT NULL,
  gender TEXT DEFAULT NULL,
  preferred_gender TEXT DEFAULT NULL,
  looking_for TEXT DEFAULT '[]',
  interests TEXT DEFAULT '[]',
  profile_photos TEXT DEFAULT '[]',
  unimatch_profile_complete BOOLEAN DEFAULT false,
  unimatch_verification_status TEXT DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Products Table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL NOT NULL,
  original_price DECIMAL,
  category TEXT,
  condition TEXT CHECK (condition IN ('Like New', 'Good', 'Fair', 'Poor')) DEFAULT 'Good',
  image_url TEXT,
  status TEXT CHECK (status IN ('Available', 'Sold')) DEFAULT 'Available',
  buyer_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Roommate Listings Table
CREATE TABLE IF NOT EXISTS public.roommate_listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  college TEXT,
  budget NUMERIC,
  area TEXT,
  room_type TEXT,
  move_in_date DATE,
  gender_preference TEXT,
  lifestyle_preferences TEXT[],
  bio TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- UniMatch Likes Table
CREATE TABLE IF NOT EXISTS public.unimatch_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  liker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  liked_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  action TEXT CHECK (action IN ('like', 'pass')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(liker_id, liked_user_id)
);

-- UniMatch Matches Table
CREATE TABLE IF NOT EXISTS public.unimatch_matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  user2_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  icebreaker_completed BOOLEAN DEFAULT FALSE,
  insta_shared_user1 BOOLEAN DEFAULT FALSE,
  insta_shared_user2 BOOLEAN DEFAULT FALSE,
  matched_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user1_id, user2_id)
);

-- UniMatch Chats Table
CREATE TABLE IF NOT EXISTS public.unimatch_chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  compressed_text TEXT NOT NULL,
  is_compressed BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ── 2. ENSURE ALL PROFILE COLUMNS EXIST ──────────────────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS college TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS major TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS year_of_study TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS enrollment_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS id_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verification_feedback TEXT DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'customer';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS instagram_username TEXT DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_gender TEXT DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS looking_for TEXT DEFAULT '[]';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS interests TEXT DEFAULT '[]';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_photos TEXT DEFAULT '[]';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS unimatch_profile_complete BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS unimatch_verification_status TEXT DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Update role constraint safely
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT constraint_name 
        FROM information_schema.constraint_column_usage 
        WHERE table_name = 'profiles' AND column_name = 'role'
    LOOP
        EXECUTE 'ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name);
    END LOOP;
END $$;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('customer', 'seller', 'admin', 'student'));

-- ── 3. SYNC USERS: COPY ALL AUTH.USERS INTO PUBLIC.PROFILES ──────────────────
INSERT INTO public.profiles (id, email, role, is_verified, full_name, avatar_url, created_at)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'role', 'customer'),
  false,
  COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', split_part(email, '@', 1)),
  COALESCE(raw_user_meta_data->>'avatar_url', raw_user_meta_data->>'picture', NULL),
  created_at
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
  avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url);

-- ── 4. AUTO-TRIGGER FOR NEW USER SIGN-UPS ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    role, 
    is_verified, 
    full_name, 
    avatar_url, 
    created_at
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'customer'),
    false,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', NULL),
    now()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ── 5. RECURSION-SAFE IS_ADMIN() FUNCTION ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql STABLE AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- ── 6. ROW LEVEL SECURITY (RLS) FOR PROFILES ─────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can select all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow anon read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete any profile" ON public.profiles;

-- Allow all authenticated users (students & admins) to view profiles
CREATE POLICY "Allow authenticated read profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING ( true );

-- Allow anonymous visitors to read profiles (for public product & listing views)
CREATE POLICY "Allow anon read profiles"
  ON public.profiles FOR SELECT
  TO anon
  USING ( true );

-- User update own profile OR Admin update any profile
CREATE POLICY "Allow update profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING ( auth.uid() = id OR public.is_admin() )
  WITH CHECK ( auth.uid() = id OR public.is_admin() );

-- Admin delete profile
CREATE POLICY "Admins can delete any profile"
  ON public.profiles FOR DELETE
  TO authenticated
  USING ( auth.uid() = id OR public.is_admin() );

-- ── 7. RLS POLICIES FOR UNIMATCH TABLES ──────────────────────────────────────
ALTER TABLE public.unimatch_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own likes" ON public.unimatch_likes;
CREATE POLICY "Users can view their own likes" ON public.unimatch_likes
  FOR SELECT TO authenticated
  USING ( auth.uid() = liker_id OR auth.uid() = liked_user_id OR public.is_admin() );

DROP POLICY IF EXISTS "Users can insert their own likes" ON public.unimatch_likes;
CREATE POLICY "Users can insert their own likes" ON public.unimatch_likes
  FOR INSERT TO authenticated
  WITH CHECK ( auth.uid() = liker_id );

DROP POLICY IF EXISTS "Admins can delete any unimatch likes" ON public.unimatch_likes;
CREATE POLICY "Admins can delete any unimatch likes" ON public.unimatch_likes
  FOR DELETE TO authenticated
  USING ( auth.uid() = liker_id OR auth.uid() = liked_user_id OR public.is_admin() );

ALTER TABLE public.unimatch_matches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their matches" ON public.unimatch_matches;
CREATE POLICY "Users can view their matches" ON public.unimatch_matches
  FOR SELECT TO authenticated
  USING ( auth.uid() = user1_id OR auth.uid() = user2_id OR public.is_admin() );

DROP POLICY IF EXISTS "Admins can delete any unimatch matches" ON public.unimatch_matches;
CREATE POLICY "Admins can delete any unimatch matches" ON public.unimatch_matches
  FOR DELETE TO authenticated
  USING ( auth.uid() = user1_id OR auth.uid() = user2_id OR public.is_admin() );

ALTER TABLE public.unimatch_chats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own chats" ON public.unimatch_chats;
CREATE POLICY "Users can view their own chats" ON public.unimatch_chats
  FOR SELECT TO authenticated
  USING ( auth.uid() = sender_id OR auth.uid() = receiver_id OR public.is_admin() );

DROP POLICY IF EXISTS "Users can send chats" ON public.unimatch_chats;
CREATE POLICY "Users can send chats" ON public.unimatch_chats
  FOR INSERT TO authenticated
  WITH CHECK ( auth.uid() = sender_id );

DROP POLICY IF EXISTS "Admins can delete any unimatch chats" ON public.unimatch_chats;
CREATE POLICY "Admins can delete any unimatch chats" ON public.unimatch_chats
  FOR DELETE TO authenticated
  USING ( auth.uid() = sender_id OR auth.uid() = receiver_id OR public.is_admin() );

-- ── 8. STORED PROCEDURE: COMPLETE ACCOUNT DELETION BY ADMIN ───────────────────
CREATE OR REPLACE FUNCTION public.admin_delete_user_complete(target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admins only.';
  END IF;

  DELETE FROM public.unimatch_chats WHERE sender_id = target_user_id OR receiver_id = target_user_id;
  DELETE FROM public.unimatch_matches WHERE user1_id = target_user_id OR user2_id = target_user_id;
  DELETE FROM public.unimatch_likes WHERE liker_id = target_user_id OR liked_user_id = target_user_id;
  DELETE FROM public.roommate_listings WHERE user_id = target_user_id;
  DELETE FROM public.products WHERE seller_id = target_user_id;
  DELETE FROM public.profiles WHERE id = target_user_id;

  RETURN jsonb_build_object('success', true, 'deleted_user_id', target_user_id);
END;
$$;

-- ── 9. STORED PROCEDURE: PURGE ONLY UNIMATCH PROFILE BY ADMIN ─────────────────
CREATE OR REPLACE FUNCTION public.admin_purge_unimatch_profile(target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admins only.';
  END IF;

  DELETE FROM public.unimatch_chats WHERE sender_id = target_user_id OR receiver_id = target_user_id;
  DELETE FROM public.unimatch_matches WHERE user1_id = target_user_id OR user2_id = target_user_id;
  DELETE FROM public.unimatch_likes WHERE liker_id = target_user_id OR liked_user_id = target_user_id;

  UPDATE public.profiles
  SET
    instagram_username = NULL,
    major = NULL,
    bio = NULL,
    gender = NULL,
    preferred_gender = NULL,
    looking_for = '[]',
    interests = '[]',
    profile_photos = '[]',
    unimatch_profile_complete = false,
    unimatch_verification_status = NULL
  WHERE id = target_user_id;

  RETURN jsonb_build_object('success', true, 'purged_unimatch_user_id', target_user_id);
END;
$$;

-- ── 10. STORED PROCEDURE: AUTO-APPROVE ALL PENDING VERIFICATIONS ──────────────
CREATE OR REPLACE FUNCTION public.admin_auto_approve_all_verifications()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  approved_count INTEGER;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admins only.';
  END IF;

  WITH updated AS (
    UPDATE public.profiles
    SET 
      is_verified = true,
      verification_status = 'verified',
      unimatch_verification_status = 'verified',
      verification_feedback = NULL
    WHERE 
      (is_verified = false OR is_verified IS NULL)
      AND (
        verification_status = 'pending' 
        OR unimatch_verification_status = 'pending'
        OR (id_url IS NOT NULL AND id_url <> '')
      )
    RETURNING id
  )
  SELECT count(*) INTO approved_count FROM updated;

  RETURN approved_count;
END;
$$;
