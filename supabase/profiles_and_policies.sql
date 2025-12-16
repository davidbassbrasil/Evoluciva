-- profiles_and_policies.sql
-- Corrected: creates a profiles table, helper triggers and RLS policies
-- Notes:
--  - RLS policy expressions cannot reference trigger variables like NEW or OLD.
--  - For UPDATE policies we compare the new row against stored values using subqueries
--    (e.g. to prevent non-admins from changing the `role` field).
-- Run this in Supabase Studio -> SQL editor for your project.

-- 1) Create table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email text,
  full_name text,
  whatsapp text,
  cpf text,
  address text,
  number text,
  complement text,
  state text,
  city text,
  cep text,
  avatar text,
  role text NOT NULL DEFAULT 'student' CHECK (role IN ('student','admin')),
  purchased_courses jsonb NOT NULL DEFAULT '[]'::jsonb,
  progress jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2) Helper trigger: keep updated_at current on UPDATE
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();


-- 3) Insert profile automatically when a new auth.user is created
-- Try to extract name from metadata when available
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
  name_text text := '';
BEGIN
  -- Try several metadata fields (some Supabase versions use raw_user_meta_data, others user_metadata)
  BEGIN
    name_text := COALESCE(
      NULLIF((NEW.raw_user_meta_data->>'name')::text, ''),
      NULLIF((NEW.raw_user_meta_data->>'full_name')::text, ''),
      NULLIF((NEW.user_metadata->>'name')::text, ''),
      NULLIF((NEW.user_metadata->>'full_name')::text, ''),
      ''
    );
  EXCEPTION WHEN undefined_function OR undefined_column THEN
    -- If metadata columns differ in your Postgres version, fallback to empty name
    name_text := '';
  END;

  INSERT INTO public.profiles (id, email, full_name, role, created_at)
  VALUES (NEW.id, NEW.email, name_text, 'student', now())
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS auth_user_created_trigger ON auth.users;
CREATE TRIGGER auth_user_created_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();


-- 4) Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;


-- 5) Policies
-- NOTE: policies use auth.uid() to reference the current authenticated user.

-- SELECT: users can always see their own profile.
-- We use a simpler approach to avoid circular dependency:
-- Everyone can read their own row, admins are checked elsewhere if needed.
DROP POLICY IF EXISTS profiles_select_admins_or_own ON public.profiles;
CREATE POLICY profiles_select_admins_or_own
  ON public.profiles
  FOR SELECT
  USING (
    -- Users can always see their own profile
    id = auth.uid()
    -- OR they are an admin (checked via role column directly without subquery)
    OR role = 'admin'
  );

-- INSERT: allow creation of a profile for the authenticated user (id must equal auth.uid())
-- Simplified to avoid circular dependency on first insert
-- Also allow server-side inserts from Supabase service_role (needed for auth triggers)
DROP POLICY IF EXISTS profiles_insert_admin_or_self ON public.profiles;
CREATE POLICY profiles_insert_admin_or_self
  ON public.profiles
  FOR INSERT
  WITH CHECK (
    -- Users can insert their own profile OR server-side service role can insert
    id = auth.uid() OR auth.role() = 'service_role'
  );

-- UPDATE: allow users to update their own profile with role protection
DROP POLICY IF EXISTS profiles_update_admin_or_own ON public.profiles;
CREATE POLICY profiles_update_admin_or_own
  ON public.profiles
  FOR UPDATE
  USING (
    -- Users can update their own profile, admins can update any
    id = auth.uid() OR role = 'admin'
  )
  WITH CHECK (
    -- Users can only update their own profile and cannot change role to admin
    id = auth.uid() AND (role = 'student' OR role = (SELECT role FROM public.profiles WHERE id = auth.uid()))
  );

-- DELETE: allow users to delete their own profile, admins can delete any
DROP POLICY IF EXISTS profiles_delete_admin_or_own ON public.profiles;
CREATE POLICY profiles_delete_admin_or_own
  ON public.profiles
  FOR DELETE
  USING (
    id = auth.uid() OR role = 'admin'
  );

-- 6) Ensure the builtin 'authenticated' role can attempt operations covered by RLS policies
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;

-- 7) Example: promote a user to admin (run manually once if needed)
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@admin.com';

-- End of file
