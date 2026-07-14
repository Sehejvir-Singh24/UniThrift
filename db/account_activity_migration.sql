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
