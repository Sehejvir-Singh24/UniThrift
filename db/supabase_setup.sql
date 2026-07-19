-- 1. Create Profiles Table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT CHECK (role IN ('customer', 'seller')) DEFAULT 'customer',
  is_verified BOOLEAN DEFAULT false,
  full_name TEXT,
  phone_number TEXT,
  enrollment_number TEXT,
  year_of_study TEXT,
  id_url TEXT,
  father_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone."
  ON public.profiles FOR SELECT
  USING ( true );

CREATE POLICY "Users can insert their own profile."
  ON public.profiles FOR INSERT
  WITH CHECK ( auth.uid() = id );

CREATE POLICY "Users can update own profile."
  ON public.profiles FOR UPDATE
  USING ( auth.uid() = id );

-- 2. Trigger for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, is_verified, full_name, phone_number, enrollment_number, year_of_study, id_url)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'customer'),
    false,
    NULL,
    NULL,
    NULL,
    NULL,
    new.raw_user_meta_data->>'id_url'
  );
  RETURN new;
END;
$$;

-- Attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 3. Create sample Products table
CREATE TABLE public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID REFERENCES public.profiles(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL NOT NULL,
  original_price DECIMAL,
  category TEXT,
  condition TEXT CHECK (condition IN ('Like New', 'Good', 'Fair', 'Poor')) DEFAULT 'Good',
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Products Policies
CREATE POLICY "Products are viewable by everyone."
  ON public.products FOR SELECT
  USING ( true );

CREATE POLICY "Verified users can insert products."
  ON public.products FOR INSERT
  WITH CHECK ( 
    auth.uid() = seller_id AND 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_verified = true
    )
  );

CREATE POLICY "Verified users can update their own products."
  ON public.products FOR UPDATE
  USING ( 
    auth.uid() = seller_id AND 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_verified = true
    )
  );

CREATE POLICY "Verified users can delete their own products."
  ON public.products FOR DELETE
  USING ( 
    auth.uid() = seller_id AND 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_verified = true
    )
  );

-- 4. Setup Storage for ID Cards
INSERT INTO storage.buckets (id, name, public) 
VALUES ('id_cards', 'id_cards', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for 'id_cards' bucket
CREATE POLICY "Anyone can view id_cards" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'id_cards');

CREATE POLICY "Authenticated users can upload id_cards" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'id_cards' AND 
  auth.role() = 'authenticated'
);

-- 5. Setup Storage for Product Images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product_images', 'product_images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view product_images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'product_images');

CREATE POLICY "Authenticated users can upload product_images" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'product_images' AND 
  auth.role() = 'authenticated'
);

-- 6. Migration: Add new columns to existing products table
-- Run these if you already have a products table from a previous deployment
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS original_price DECIMAL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS condition TEXT CHECK (condition IN ('Like New', 'Good', 'Fair', 'Poor')) DEFAULT 'Good';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url TEXT;


-- Account Activity & Profile Photo Migration

-- 1. Add avatar_url to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Add status and buyer_id to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('Available', 'Sold')) DEFAULT 'Available';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS buyer_id UUID REFERENCES public.profiles(id);

-- 3. Create saved_items table
CREATE TABLE IF NOT EXISTS public.saved_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, product_id)
);

ALTER TABLE public.saved_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own saved items"
  ON public.saved_items FOR SELECT
  USING ( auth.uid() = user_id );

CREATE POLICY "Users can insert their own saved items"
  ON public.saved_items FOR INSERT
  WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "Users can delete their own saved items"
  ON public.saved_items FOR DELETE
  USING ( auth.uid() = user_id );

-- 4. Setup Storage for Avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view avatars" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'avatars' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own avatars" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (string_to_array(name, '/'))[1]
);

CREATE POLICY "Users can delete their own avatars" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (string_to_array(name, '/'))[1]
);


-- Add college column
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS college TEXT;


-- Added later
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS father_name TEXT;
