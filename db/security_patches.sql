-- Security Patch: Restrict profiles table to authenticated users only
-- Prevents public (unauthenticated) mass scraping of user PII (emails, phone numbers).

BEGIN;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;

-- Allow only authenticated users to view profiles
-- (Note: A more comprehensive fix would separate PII into a private_profiles table)
CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING ( true );

COMMIT;
