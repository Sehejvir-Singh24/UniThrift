-- College Areas Migration
-- Run this in your Supabase SQL Editor to seed the dynamic "Smart Areas" for roommate finding

-- 1. Create the table
CREATE TABLE IF NOT EXISTS public.college_areas (
  college_name TEXT PRIMARY KEY,
  areas TEXT[] NOT NULL DEFAULT '{}'::TEXT[]
);

-- 2. Enable RLS
ALTER TABLE public.college_areas ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Anyone can read college areas
DROP POLICY IF EXISTS "Anyone can view college areas" ON public.college_areas;
CREATE POLICY "Anyone can view college areas"
  ON public.college_areas FOR SELECT
  USING ( true );

-- 4. Seed Data for GGSIPU B.Tech Colleges
INSERT INTO public.college_areas (college_name, areas) VALUES
  ('USICT', ARRAY['Dwarka Sec 16', 'Dwarka Sec 14', 'Palam', 'Janakpuri', 'Kakrola']),
  ('MAIT', ARRAY['Rohini Sec 22', 'Rohini Sec 20', 'Pitampura', 'Prashant Vihar']),
  ('MSIT', ARRAY['Janakpuri', 'Vikas Puri', 'Uttam Nagar', 'Tilak Nagar']),
  ('BPIT', ARRAY['Rohini Sec 17', 'Rohini Sec 15', 'Pitampura', 'Shalimar Bagh']),
  ('BVCOE', ARRAY['Paschim Vihar', 'Punjabi Bagh', 'Peera Garhi', 'MadiPur']),
  ('GTBIT', ARRAY['Hari Nagar', 'Subhash Nagar', 'Rajouri Garden', 'Janakpuri', 'Maya Puri']),
  ('GTB4CEC', ARRAY['Hari Nagar', 'Subhash Nagar', 'Rajouri Garden', 'Janakpuri', 'Maya Puri']),
  ('ADGITM', ARRAY['Shastri Park', 'Seelampur', 'Shahdara', 'Yamuna Vihar']),
  ('VIPS-TC', ARRAY['Pitampura', 'Rohini Sec 9', 'Rohini Sec 7', 'Shalimar Bagh']),
  ('HMRITM', ARRAY['Hamidpur', 'Alipur', 'Narela', 'Bawana']),
  ('JIMS', ARRAY['Greater Noida', 'Knowledge Park III', 'Pari Chowk']),
  ('DTC', ARRAY['Greater Noida', 'Knowledge Park III', 'Pari Chowk'])
ON CONFLICT (college_name) DO UPDATE 
SET areas = EXCLUDED.areas;
