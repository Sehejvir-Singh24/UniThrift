-- unimatch_delayed_match_migration.sql
-- Run this in your Supabase SQL Editor to support 10-minute delayed match notifications & icebreakers

ALTER TABLE public.unimatch_matches
  ADD COLUMN IF NOT EXISTS reveal_available_at TIMESTAMP WITH TIME ZONE DEFAULT (timezone('utc'::text, now()) + INTERVAL '10 minutes'),
  ADD COLUMN IF NOT EXISTS user1_unlocked BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS user2_unlocked BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS icebreaker_prompt TEXT,
  ADD COLUMN IF NOT EXISTS common_interests TEXT,
  ADD COLUMN IF NOT EXISTS notified_user1 BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS notified_user2 BOOLEAN DEFAULT FALSE;

-- Ensure RLS policies allow authenticated users to select/update their own match records
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
