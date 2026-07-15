-- Admin Verification Setup Migration

-- 1. Safely drop existing check constraints on profiles.role and update to include 'admin'
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT constraint_name 
        FROM information_schema.constraint_column_usage 
        WHERE table_name = 'profiles' AND column_name = 'role'
    LOOP
        EXECUTE 'ALTER TABLE public.profiles DROP CONSTRAINT ' || quote_ident(r.constraint_name);
    END LOOP;
END $$;

ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('customer', 'seller', 'admin'));

-- 2. Create recursion-safe is_admin() helper function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- 3. Add admin policies for public.profiles table
DROP POLICY IF EXISTS "Admins can select all profiles" ON public.profiles;
CREATE POLICY "Admins can select all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING ( public.is_admin() );

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE TO authenticated
  USING ( public.is_admin() )
  WITH CHECK ( public.is_admin() );

-- 4. Add admin policies for public.products table
DROP POLICY IF EXISTS "Admins can delete any product" ON public.products;
CREATE POLICY "Admins can delete any product" ON public.products
  FOR DELETE TO authenticated
  USING ( public.is_admin() );
