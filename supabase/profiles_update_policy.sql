-- Ensure admin-check exists and create safe UPDATE policy for profiles
-- Run this in Supabase SQL Editor

-- 1) Create/replace function to check if auth user is an admin
CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = uid AND role = 'admin');
$$;

-- 2) Replace SELECT policy (safe for admins or owner)
DROP POLICY IF EXISTS profiles_select_admins_or_own ON public.profiles;
CREATE POLICY profiles_select_admins_or_own
  ON public.profiles
  FOR SELECT
  USING (
    id = auth.uid() OR public.is_admin(auth.uid())
  );

-- 3) Replace UPDATE policy so owners or admins can update
DROP POLICY IF EXISTS profiles_update_admin_or_own ON public.profiles;
CREATE POLICY profiles_update_admin_or_own
  ON public.profiles
  FOR UPDATE
  USING (
    id = auth.uid() OR public.is_admin(auth.uid())
  )
  WITH CHECK (
    id = auth.uid() OR public.is_admin(auth.uid())
  );

-- 4) (Optional) Ensure INSERT/DELETE policies exist — adjust as needed
DROP POLICY IF EXISTS profiles_insert_admin_or_self ON public.profiles;
CREATE POLICY profiles_insert_admin_or_self
  ON public.profiles
  FOR INSERT
  WITH CHECK (
    -- allow inserting a profile for yourself, allow admins, or allow service role (server-side triggers)
    (auth.uid() IS NOT NULL AND id = auth.uid()) OR public.is_admin(auth.uid()) OR auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS profiles_delete_admin_or_own ON public.profiles;
CREATE POLICY profiles_delete_admin_or_own
  ON public.profiles
  FOR DELETE
  USING (
    id = auth.uid() OR public.is_admin(auth.uid())
  );

-- 5) Ensure authenticated role has basic privileges (optional, adjust to your security model)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;

-- Notes:
-- - After running this, verify that your admin user exists in public.profiles and has role = 'admin'.
-- - If you're still getting 406 errors when returning rows, ensure that RLS is enabled and these policies are applied.
-- - Running in Supabase SQL Editor is required; this file cannot be applied from the frontend app.
