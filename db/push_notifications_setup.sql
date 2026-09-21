-- ================================================================
-- UniThrift & UniMatch Push Notifications & Realtime Setup
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql
-- ================================================================

-- 1. Create push_subscriptions table for Web Push
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  platform TEXT DEFAULT 'web',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, endpoint)
);

-- Enable RLS on push_subscriptions
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can manage their own push subscriptions"
  ON public.push_subscriptions
  FOR ALL
  TO authenticated
  USING ( auth.uid() = user_id )
  WITH CHECK ( auth.uid() = user_id );

-- 2. Allow Authenticated Users to Insert Notifications (for Likes, Matches & Offers)
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.notifications;
CREATE POLICY "Authenticated users can create notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK ( true );

-- 3. Database Trigger: Auto-Notify on UniMatch Like
CREATE OR REPLACE FUNCTION notify_on_unimatch_like()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.action = 'like' THEN
    -- Avoid duplicate like notifications within the last 24 hours
    IF NOT EXISTS (
      SELECT 1 FROM public.notifications
      WHERE user_id = NEW.liked_user_id
        AND type = 'unimatch_like'
        AND created_at > (now() - interval '24 hours')
    ) THEN
      INSERT INTO public.notifications (user_id, title, message, type)
      VALUES (
        NEW.liked_user_id,
        'Someone liked your profile! 💕',
        'A verified student on campus just liked you on UniMatch. Open UniMatch to see who it is!',
        'unimatch_like'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_on_unimatch_like ON public.unimatch_likes;
CREATE TRIGGER trigger_notify_on_unimatch_like
  AFTER INSERT OR UPDATE ON public.unimatch_likes
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_unimatch_like();

-- 4. Enable Supabase Realtime on notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
