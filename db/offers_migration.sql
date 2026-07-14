-- Create Offers Table
CREATE TABLE IF NOT EXISTS public.offers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  buyer_id UUID REFERENCES public.profiles(id) NOT NULL,
  seller_id UUID REFERENCES public.profiles(id) NOT NULL,
  offer_amount DECIMAL NOT NULL,
  message TEXT,
  status TEXT CHECK (status IN ('Pending', 'Accepted', 'Rejected', 'Countered')) DEFAULT 'Pending' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- 1. Select Policy: Users can view offers they either sent (as buyer) or received (as seller)
CREATE POLICY "Users can view their own sent or received offers"
  ON public.offers FOR SELECT
  USING ( auth.uid() = buyer_id OR auth.uid() = seller_id );

-- 2. Insert Policy: Authenticated users can insert their own offers
CREATE POLICY "Users can create offers as buyers"
  ON public.offers FOR INSERT
  WITH CHECK ( auth.uid() = buyer_id );

-- 3. Update Policy: Buyers or Sellers can update status/message of their offers
CREATE POLICY "Buyers or Sellers can update offers"
  ON public.offers FOR UPDATE
  USING ( auth.uid() = buyer_id OR auth.uid() = seller_id );
