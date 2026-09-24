-- ==============================================================================
-- UNITHRIFT: INSTANT FIX FOR USERS IN ADMIN DASHBOARD
-- ==============================================================================
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql
-- ==============================================================================

-- 1. Ensure profiles table exists
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  role TEXT DEFAULT 'customer',
  is_verified BOOLEAN DEFAULT false,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Ensure all required columns exist
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

-- 3. Sync all existing users from auth.users into public.profiles
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

-- 4. Set up auto-creation trigger for all future user sign-ups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, is_verified, full_name, avatar_url, created_at)
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

-- 5. Enable Row Level Security and allow reading profiles
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
DROP POLICY IF EXISTS "Allow delete profiles" ON public.profiles;

-- Allow all authenticated users (and admins) to view profiles
CREATE POLICY "Allow authenticated read profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING ( true );

CREATE POLICY "Allow anon read profiles"
  ON public.profiles FOR SELECT
  TO anon
  USING ( true );

CREATE POLICY "Allow update profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING ( true )
  WITH CHECK ( true );

CREATE POLICY "Allow delete profiles"
  ON public.profiles FOR DELETE
  TO authenticated
  USING ( true );

-- 6. Helper function is_admin()
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

-- 7. Stored Procedure: Auto-Approve All Pending Verifications
CREATE OR REPLACE FUNCTION public.admin_auto_approve_all_verifications()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  approved_count INTEGER;
BEGIN
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
