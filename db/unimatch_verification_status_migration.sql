-- UniMatch Verification Status Migration
-- Run this in your Supabase SQL Editor
-- Adds a UniMatch-specific verification column so UniThrift and UniMatch
-- verifications are fully independent of each other.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS unimatch_verification_status TEXT DEFAULT NULL;

-- Possible values:
--  NULL     : never submitted for UniMatch (new users)
--  'pending' : ID submitted, awaiting admin review
--  'verified': admin approved — grants access to UniMatch
--  'rejected': admin rejected — user must re-upload

-- Comment: Do NOT use `is_verified` for UniMatch access control.
-- `is_verified` belongs to UniThrift's seller verification system.
