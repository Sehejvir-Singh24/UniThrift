-- reservation_chat_setup.sql

-- Drop existing tables if they exist (to allow rerunning this script)
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.meetups CASCADE;
DROP TABLE IF EXISTS public.reservations CASCADE;

-- 1. Update products status constraint to include 'Reserved'
DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'public.products'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%status%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.products DROP CONSTRAINT ' || constraint_name;
  END IF;
END $$;

ALTER TABLE public.products ADD CONSTRAINT products_status_check 
  CHECK (status IN ('Available', 'Sold', 'Reserved'));

-- 2. Create Reservations Table
CREATE TABLE public.reservations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  buyer_id UUID REFERENCES public.profiles(id) NOT NULL,
  seller_id UUID REFERENCES public.profiles(id) NOT NULL,
  deposit_amount NUMERIC NOT NULL,
  remaining_amount NUMERIC NOT NULL,
  status TEXT CHECK (status IN ('Pending', 'Reserved', 'Completed', 'Cancelled')) DEFAULT 'Pending',
  buyer_confirmed BOOLEAN DEFAULT false,
  seller_confirmed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reservations"
  ON public.reservations FOR SELECT
  USING ( auth.uid() = buyer_id OR auth.uid() = seller_id );

CREATE POLICY "Buyers can insert reservations"
  ON public.reservations FOR INSERT
  WITH CHECK ( auth.uid() = buyer_id );

CREATE POLICY "Users can update their own reservations"
  ON public.reservations FOR UPDATE
  USING ( auth.uid() = buyer_id OR auth.uid() = seller_id );

-- 3. Create Meetups Table
CREATE TABLE public.meetups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reservation_id UUID REFERENCES public.reservations(id) ON DELETE CASCADE NOT NULL,
  location TEXT,
  meet_time TIMESTAMP WITH TIME ZONE,
  status TEXT CHECK (status IN ('Proposed', 'Confirmed', 'Cancelled')) DEFAULT 'Proposed',
  proposed_by UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (reservation_id)
);

ALTER TABLE public.meetups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view meetups for their reservations"
  ON public.meetups FOR SELECT
  USING ( 
    EXISTS (
      SELECT 1 FROM public.reservations r 
      WHERE r.id = meetups.reservation_id AND (r.buyer_id = auth.uid() OR r.seller_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert meetups for their reservations"
  ON public.meetups FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.reservations r 
      WHERE r.id = meetups.reservation_id AND (r.buyer_id = auth.uid() OR r.seller_id = auth.uid())
    )
  );

CREATE POLICY "Users can update meetups for their reservations"
  ON public.meetups FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.reservations r 
      WHERE r.id = meetups.reservation_id AND (r.buyer_id = auth.uid() OR r.seller_id = auth.uid())
    )
  );

-- 4. Create Messages Table
CREATE TABLE public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reservation_id UUID REFERENCES public.reservations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) NOT NULL,
  text TEXT,
  image_url TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages for their reservations"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.reservations r 
      WHERE r.id = messages.reservation_id AND (r.buyer_id = auth.uid() OR r.seller_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert messages for their reservations"
  ON public.messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.reservations r 
      WHERE r.id = messages.reservation_id AND (r.buyer_id = auth.uid() OR r.seller_id = auth.uid())
    ) AND auth.uid() = sender_id
  );

CREATE POLICY "Users can update messages for their reservations"
  ON public.messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.reservations r 
      WHERE r.id = messages.reservation_id AND (r.buyer_id = auth.uid() OR r.seller_id = auth.uid())
    )
  );

-- 5. Create Reviews Table
CREATE TABLE public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reservation_id UUID REFERENCES public.reservations(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES public.profiles(id) NOT NULL,
  reviewee_id UUID REFERENCES public.profiles(id) NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (reservation_id, reviewer_id)
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews"
  ON public.reviews FOR SELECT
  USING ( true );

CREATE POLICY "Users can insert reviews for their reservations"
  ON public.reviews FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.reservations r 
      WHERE r.id = reviews.reservation_id AND (r.buyer_id = auth.uid() OR r.seller_id = auth.uid())
    ) AND auth.uid() = reviewer_id
  );

-- 6. Storage for Chat Images (Optional, if we want to allow sending images in chat)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat_images', 'chat_images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Anyone can view chat_images" ON storage.objects;
CREATE POLICY "Anyone can view chat_images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'chat_images');

DROP POLICY IF EXISTS "Authenticated users can upload chat_images" ON storage.objects;
CREATE POLICY "Authenticated users can upload chat_images" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'chat_images' AND 
  auth.role() = 'authenticated'
);
