-- Bug Reports Table Migration
-- Run this in Supabase SQL editor

CREATE TABLE IF NOT EXISTS public.bug_reports (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type           TEXT NOT NULL DEFAULT 'bug' CHECK (type IN ('bug', 'ui_bug', 'feature_request', 'help')),
  page_url       TEXT,
  title          TEXT NOT NULL,
  description    TEXT,
  status         TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at    TIMESTAMPTZ
);

-- RLS
ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated (or anonymous) can insert
DROP POLICY IF EXISTS "Anyone can submit bug reports" ON public.bug_reports;
CREATE POLICY "Anyone can submit bug reports"
  ON public.bug_reports FOR INSERT
  WITH CHECK (true);

-- Only admins can read all reports
DROP POLICY IF EXISTS "Admins can view all bug reports" ON public.bug_reports;
CREATE POLICY "Admins can view all bug reports"
  ON public.bug_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can update (mark resolved, change status)
DROP POLICY IF EXISTS "Admins can update bug reports" ON public.bug_reports;
CREATE POLICY "Admins can update bug reports"
  ON public.bug_reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_bug_reports_status    ON public.bug_reports(status);
CREATE INDEX IF NOT EXISTS idx_bug_reports_created   ON public.bug_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bug_reports_reporter  ON public.bug_reports(reporter_id);
