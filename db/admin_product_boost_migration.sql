-- Admin-controlled marketplace product boosts.
-- Run this migration in the Supabase SQL editor after admin_setup.sql.

BEGIN;

CREATE OR REPLACE FUNCTION public.admin_set_product_boost(
  p_product_id UUID,
  p_days INTEGER DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  is_boosted BOOLEAN,
  boosted_at TIMESTAMP WITH TIME ZONE,
  boosted_until TIMESTAMP WITH TIME ZONE
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  IF p_days IS NOT NULL AND (p_days < 1 OR p_days > 365) THEN
    RAISE EXCEPTION 'Boost duration must be between 1 and 365 days';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.products WHERE products.id = p_product_id) THEN
    RAISE EXCEPTION 'Product not found';
  END IF;

  IF p_days IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.products
    WHERE products.id = p_product_id
      AND (products.status IS NULL OR lower(products.status) = 'available')
  ) THEN
    RAISE EXCEPTION 'Only available products can be boosted';
  END IF;

  IF p_days IS NULL THEN
    RETURN QUERY
    UPDATE public.products AS product
    SET is_boosted = false,
        boosted_at = NULL,
        boosted_until = NULL
    WHERE product.id = p_product_id
    RETURNING product.id, product.is_boosted, product.boosted_at, product.boosted_until;
  ELSE
    RETURN QUERY
    UPDATE public.products AS product
    SET is_boosted = true,
        boosted_at = now(),
        boosted_until = now() + make_interval(days => p_days)
    WHERE product.id = p_product_id
      AND (product.status IS NULL OR lower(product.status) = 'available')
    RETURNING product.id, product.is_boosted, product.boosted_at, product.boosted_until;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_product_boost(UUID, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_product_boost(UUID, INTEGER) TO authenticated;

COMMIT;
