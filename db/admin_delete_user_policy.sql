-- Admin User Deletion and Auto-Approval Support
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Policy allowing admins to delete any profile
DROP POLICY IF EXISTS "Admins can delete any profile" ON public.profiles;
CREATE POLICY "Admins can delete any profile" ON public.profiles
  FOR DELETE TO authenticated
  USING ( public.is_admin() );

-- 2. Policy allowing admins to delete any unimatch likes
DROP POLICY IF EXISTS "Admins can delete any unimatch likes" ON public.unimatch_likes;
CREATE POLICY "Admins can delete any unimatch likes" ON public.unimatch_likes
  FOR DELETE TO authenticated
  USING ( public.is_admin() );

-- 3. Policy allowing admins to delete any unimatch matches
DROP POLICY IF EXISTS "Admins can delete any unimatch matches" ON public.unimatch_matches;
CREATE POLICY "Admins can delete any unimatch matches" ON public.unimatch_matches
  FOR DELETE TO authenticated
  USING ( public.is_admin() );

-- 4. Policy allowing admins to delete any unimatch chats
DROP POLICY IF EXISTS "Admins can delete any unimatch chats" ON public.unimatch_chats;
CREATE POLICY "Admins can delete any unimatch chats" ON public.unimatch_chats
  FOR DELETE TO authenticated
  USING ( public.is_admin() );

-- 5. Helper function for complete account purge by admin
CREATE OR REPLACE FUNCTION public.admin_delete_user_complete(target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_is_admin BOOLEAN;
BEGIN
  SELECT (role = 'admin') INTO caller_is_admin FROM public.profiles WHERE id = auth.uid();
  IF caller_is_admin IS NOT TRUE THEN
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

-- 6. Helper function to purge only UniMatch profile
CREATE OR REPLACE FUNCTION public.admin_purge_unimatch_profile(target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_is_admin BOOLEAN;
BEGIN
  SELECT (role = 'admin') INTO caller_is_admin FROM public.profiles WHERE id = auth.uid();
  IF caller_is_admin IS NOT TRUE THEN
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

-- 7. Helper function for auto-approving all pending verifications
CREATE OR REPLACE FUNCTION public.admin_auto_approve_all_verifications()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  approved_count INTEGER;
  caller_is_admin BOOLEAN;
BEGIN
  SELECT (role = 'admin') INTO caller_is_admin FROM public.profiles WHERE id = auth.uid();
  IF caller_is_admin IS NOT TRUE THEN
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
