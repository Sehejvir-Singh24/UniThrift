-- Listings Database Setup Migration
-- Setup tables and RLS for Roommates and PGs

-- 1. Create Roommate Listings Table
CREATE TABLE IF NOT EXISTS public.roommate_listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  budget DECIMAL NOT NULL,
  preferred_area TEXT,
  bio TEXT,
  tags TEXT[] DEFAULT '{}'::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.roommate_listings ENABLE ROW LEVEL SECURITY;

-- Roommate Listings Policies
DROP POLICY IF EXISTS "Anyone can view roommate listings" ON public.roommate_listings;
CREATE POLICY "Anyone can view roommate listings" ON public.roommate_listings
  FOR SELECT USING ( true );

DROP POLICY IF EXISTS "Users can insert their own roommate listings" ON public.roommate_listings;
CREATE POLICY "Users can insert their own roommate listings" ON public.roommate_listings
  FOR INSERT TO authenticated
  WITH CHECK ( auth.uid() = user_id );

DROP POLICY IF EXISTS "Users can update their own roommate listings" ON public.roommate_listings;
CREATE POLICY "Users can update their own roommate listings" ON public.roommate_listings
  FOR UPDATE TO authenticated
  USING ( auth.uid() = user_id );

DROP POLICY IF EXISTS "Users can delete their own roommate listings" ON public.roommate_listings;
CREATE POLICY "Users can delete their own roommate listings" ON public.roommate_listings
  FOR DELETE TO authenticated
  USING ( auth.uid() = user_id );

DROP POLICY IF EXISTS "Admins can delete any roommate listing" ON public.roommate_listings;
CREATE POLICY "Admins can delete any roommate listing" ON public.roommate_listings
  FOR DELETE TO authenticated
  USING ( public.is_admin() );


-- 2. Create PG Listings Table
CREATE TABLE IF NOT EXISTS public.pg_listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL NOT NULL,
  type TEXT CHECK (type IN ('Boys Only', 'Girls Only', 'Co-Ed')) DEFAULT 'Co-Ed',
  address TEXT,
  amenities TEXT[] DEFAULT '{}'::TEXT[],
  rating DECIMAL DEFAULT 5.0,
  distance_to_campus TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.pg_listings ENABLE ROW LEVEL SECURITY;

-- PG Listings Policies
DROP POLICY IF EXISTS "Anyone can view pg listings" ON public.pg_listings;
CREATE POLICY "Anyone can view pg listings" ON public.pg_listings
  FOR SELECT USING ( true );

DROP POLICY IF EXISTS "Admins can insert pg listings" ON public.pg_listings;
CREATE POLICY "Admins can insert pg listings" ON public.pg_listings
  FOR INSERT TO authenticated
  WITH CHECK ( public.is_admin() );

DROP POLICY IF EXISTS "Admins can update pg listings" ON public.pg_listings;
CREATE POLICY "Admins can update pg listings" ON public.pg_listings
  FOR UPDATE TO authenticated
  USING ( public.is_admin() );

DROP POLICY IF EXISTS "Admins can delete pg listings" ON public.pg_listings;
CREATE POLICY "Admins can delete pg listings" ON public.pg_listings
  FOR DELETE TO authenticated
  USING ( public.is_admin() );
