-- UniMatch Compressed On-Site Chat Migration
-- Run this script in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

CREATE TABLE IF NOT EXISTS public.unimatch_chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  compressed_text TEXT NOT NULL,
  is_compressed BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for fast chat queries between matched users
CREATE INDEX IF NOT EXISTS idx_unimatch_chats_users ON public.unimatch_chats(sender_id, receiver_id);

-- Enable Row Level Security (RLS) on unimatch_chats
ALTER TABLE public.unimatch_chats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own chats" ON public.unimatch_chats;
CREATE POLICY "Users can view their own chats"
  ON public.unimatch_chats FOR SELECT
  TO authenticated
  USING ( auth.uid() = sender_id OR auth.uid() = receiver_id );

DROP POLICY IF EXISTS "Users can send chats" ON public.unimatch_chats;
CREATE POLICY "Users can send chats"
  ON public.unimatch_chats FOR INSERT
  TO authenticated
  WITH CHECK ( auth.uid() = sender_id );

DROP POLICY IF EXISTS "Users can delete their own chats" ON public.unimatch_chats;
CREATE POLICY "Users can delete their own chats"
  ON public.unimatch_chats FOR DELETE
  TO authenticated
  USING ( auth.uid() = sender_id );
