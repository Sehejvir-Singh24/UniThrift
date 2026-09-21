-- Migration: Add UPDATE Policy for unimatch_likes
-- Allows authenticated users to update their own like/pass actions and timestamps
-- (Required for Supabase upsert ON CONFLICT (liker_id, liked_user_id) DO UPDATE)

DROP POLICY IF EXISTS "Users can update their own likes" ON public.unimatch_likes;
CREATE POLICY "Users can update their own likes"
  ON public.unimatch_likes FOR UPDATE
  TO authenticated
  USING ( auth.uid() = liker_id )
  WITH CHECK ( auth.uid() = liker_id );
