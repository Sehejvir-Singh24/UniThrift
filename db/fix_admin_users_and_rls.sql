-- ==============================================================================
-- UNITHRIFT & UNIMATCH: COMPLETE ADMIN & PROFILES FIX
-- ==============================================================================
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql
--
-- This script fixes:
-- 1. Syncs all auth.users into public.profiles (so all users show in the dashboard)
-- 2. Sets up automatic profile creation trigger for future sign-ups
-- 3. Configures Row Level Security (RLS) so admins can read/update/delete any user
-- 4. Promotes your currently signed-in account to 'admin'
-- 5. Installs stored functions for 1-click auto-approve and user/profile deletion
-- ==============================================================================

-- 1. Ensure all columns exist on public.profiles
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

-- 2. Backfill: Copy all existing auth.users into public.profiles
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

-- 3. Automatic Profile Creation Trigger on Sign-Up
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

-- 4. Helper function: is_admin() without recursive lock
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

-- 5. Fix Row Level Security (RLS) on public.profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can select all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated read profiles" ON public.profiles;

-- Allow all authenticated users (students & admins) to view profiles
CREATE POLICY "Allow authenticated read profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING ( true );

-- Also allow anon to read basic profile info for public store/listing views
DROP POLICY IF EXISTS "Allow anon read profiles" ON public.profiles;
CREATE POLICY "Allow anon read profiles"
  ON public.profiles FOR SELECT
  TO anon
  USING ( true );

-- User update own profile OR Admin update any profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow update profiles" ON public.profiles;

CREATE POLICY "Allow update profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING ( auth.uid() = id OR public.is_admin() )
  WITH CHECK ( auth.uid() = id OR public.is_admin() );

-- Admin delete profile
DROP POLICY IF EXISTS "Admins can delete any profile" ON public.profiles;
CREATE POLICY "Admins can delete any profile"
  ON public.profiles FOR DELETE
  TO authenticated
  USING ( auth.uid() = id OR public.is_admin() );

-- 6. RLS for UniMatch Tables
ALTER TABLE IF EXISTS public.unimatch_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can delete any unimatch likes" ON public.unimatch_likes;
CREATE POLICY "Admins can delete any unimatch likes" ON public.unimatch_likes
  FOR DELETE TO authenticated
  USING ( auth.uid() = liker_id OR auth.uid() = liked_user_id OR public.is_admin() );

ALTER TABLE IF EXISTS public.unimatch_matches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can delete any unimatch matches" ON public.unimatch_matches;
CREATE POLICY "Admins can delete any unimatch matches" ON public.unimatch_matches
  FOR DELETE TO authenticated
  USING ( auth.uid() = user1_id OR auth.uid() = user2_id OR public.is_admin() );

ALTER TABLE IF EXISTS public.unimatch_chats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can delete any unimatch chats" ON public.unimatch_chats;
CREATE POLICY "Admins can delete any unimatch chats" ON public.unimatch_chats
  FOR DELETE TO authenticated
  USING ( auth.uid() = sender_id OR auth.uid() = receiver_id OR public.is_admin() );

-- 7. Stored Procedure: Complete Account Deletion by Admin
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

-- 8. Stored Procedure: Purge Only UniMatch Profile by Admin
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

-- 9. Stored Procedure: Auto-Approve All Pending Verifications
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

-- 10. Grant current user admin role (if authenticated in SQL Editor)
UPDATE public.profiles
SET role = 'admin'
WHERE id = auth.uid();
