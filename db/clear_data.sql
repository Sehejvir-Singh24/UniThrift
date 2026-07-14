-- DANGER: EXECUTING THIS SCRIPT WILL DELETE ALL USERS AND DATA
-- Run this in your Supabase SQL Editor to start completely fresh.

-- This deletes all users from the authentication system. 
-- Because we set up our tables with foreign keys and cascading deletes, 
-- deleting the users will automatically wipe out their profiles, products, and saved items!

DELETE FROM auth.users;

-- (Optional) If you also want to delete any leftover products that somehow didn't belong to a user
DELETE FROM public.products;
