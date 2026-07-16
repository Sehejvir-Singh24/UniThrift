-- Create Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 1. Select Policy: Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING ( auth.uid() = user_id );

-- 2. Update Policy: Users can update their own notifications (e.g. marking as read)
CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING ( auth.uid() = user_id );

-- 3. Delete Policy: Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
  ON public.notifications FOR DELETE
  USING ( auth.uid() = user_id );

-- Trigger Function: On New Offer (Notify Seller)
CREATE OR REPLACE FUNCTION notify_seller_on_offer()
RETURNS TRIGGER AS $$
DECLARE
  v_product_title TEXT;
  v_buyer_name TEXT;
BEGIN
  -- Get product title
  SELECT title INTO v_product_title FROM public.products WHERE id = NEW.product_id;
  -- Get buyer name
  SELECT full_name INTO v_buyer_name FROM public.profiles WHERE id = NEW.buyer_id;

  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (
    NEW.seller_id,
    'New Offer Received',
    v_buyer_name || ' offered ₹' || NEW.offer_amount || ' for ' || v_product_title,
    'offer_received'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_seller_on_offer ON public.offers;
CREATE TRIGGER trigger_notify_seller_on_offer
  AFTER INSERT ON public.offers
  FOR EACH ROW
  EXECUTE FUNCTION notify_seller_on_offer();


-- Trigger Function: On Offer Status Change (Notify Buyer)
CREATE OR REPLACE FUNCTION notify_buyer_on_offer_update()
RETURNS TRIGGER AS $$
DECLARE
  v_product_title TEXT;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    SELECT title INTO v_product_title FROM public.products WHERE id = NEW.product_id;
    
    IF NEW.status = 'Accepted' THEN
      INSERT INTO public.notifications (user_id, title, message, type)
      VALUES (NEW.buyer_id, 'Offer Accepted!', 'Your offer of ₹' || NEW.offer_amount || ' for ' || v_product_title || ' was accepted.', 'offer_accepted');
    ELSIF NEW.status = 'Countered' THEN
      INSERT INTO public.notifications (user_id, title, message, type)
      VALUES (NEW.buyer_id, 'New Counter Offer', 'The seller countered your offer for ' || v_product_title || ' with ₹' || NEW.offer_amount, 'offer_countered');
    ELSIF NEW.status = 'Rejected' THEN
      INSERT INTO public.notifications (user_id, title, message, type)
      VALUES (NEW.buyer_id, 'Offer Rejected', 'Your offer for ' || v_product_title || ' was declined.', 'offer_rejected');
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_buyer_on_offer_update ON public.offers;
CREATE TRIGGER trigger_notify_buyer_on_offer_update
  AFTER UPDATE OF status ON public.offers
  FOR EACH ROW
  EXECUTE FUNCTION notify_buyer_on_offer_update();


-- Trigger Function: On Reservation (Notify Seller)
CREATE OR REPLACE FUNCTION notify_seller_on_reservation()
RETURNS TRIGGER AS $$
DECLARE
  v_product_title TEXT;
  v_buyer_name TEXT;
BEGIN
  -- We trigger when a reservation is actually 'Reserved'
  IF NEW.status = 'Reserved' AND OLD.status = 'Pending' THEN
    SELECT title INTO v_product_title FROM public.products WHERE id = NEW.product_id;
    SELECT full_name INTO v_buyer_name FROM public.profiles WHERE id = NEW.buyer_id;

    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      NEW.seller_id,
      'Item Reserved!',
      v_buyer_name || ' paid a ₹' || NEW.deposit_amount || ' deposit for ' || v_product_title || '.',
      'reservation_created'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_seller_on_reservation ON public.reservations;
CREATE TRIGGER trigger_notify_seller_on_reservation
  AFTER UPDATE OF status ON public.reservations
  FOR EACH ROW
  EXECUTE FUNCTION notify_seller_on_reservation();
