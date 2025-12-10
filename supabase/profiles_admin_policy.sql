-- Create an admin-check function and a safe SELECT policy for profiles
-- This file can be run in Supabase SQL Editor

-- 1) Create function to check if auth user is an admin
CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = uid AND role = 'admin');
$$;

-- 2) Replace the SELECT policy to use the function for admin checks
DROP POLICY IF EXISTS profiles_select_admins_or_own ON public.profiles;

CREATE POLICY profiles_select_admins_or_own
  ON public.profiles
  FOR SELECT
  USING (
    id = auth.uid() OR public.is_admin(auth.uid())
  );

-- 3) Ensure there is an admin profile for the app operator (adjust email as needed)
-- Replace 'davidalvont@gmail.com' with the email of your admin user
INSERT INTO public.profiles (id, email, full_name, role, created_at)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'davidalvont@gmail.com'),
  'davidalvont@gmail.com',
  'Admin',
  'admin',
  now()
)
ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      full_name = EXCLUDED.full_name,
      role = 'admin';

-- 4) Make sure the admin can read/insert/update/delete profiles as per your needs
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;

-- Note: Please run this file in Supabase SQL Editor. If your environment differs, adjust the admin email value above.
