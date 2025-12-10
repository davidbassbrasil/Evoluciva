-- Quick Fix SQL - Execute este script se você está tendo erro 500
-- Este script limpa e recria tudo corretamente

-- 1) Limpar tudo (se já existir)
DROP TRIGGER IF EXISTS auth_user_created_trigger ON auth.users;
DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
DROP FUNCTION IF EXISTS public.handle_new_auth_user() CASCADE;
DROP FUNCTION IF EXISTS public.set_updated_at() CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 2) Criar tabela
CREATE TABLE public.profiles (
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

-- 3) Trigger para updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 4) Trigger para criar profile automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
  name_text text := '';
BEGIN
  BEGIN
    name_text := COALESCE(
      NULLIF((NEW.raw_user_meta_data->>'name')::text, ''),
      NULLIF((NEW.raw_user_meta_data->>'full_name')::text, ''),
      NULLIF((NEW.user_metadata->>'name')::text, ''),
      NULLIF((NEW.user_metadata->>'full_name')::text, ''),
      ''
    );
  EXCEPTION WHEN OTHERS THEN
    name_text := '';
  END;

  INSERT INTO public.profiles (id, email, full_name, role, created_at)
  VALUES (NEW.id, NEW.email, name_text, 'student', now())
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER auth_user_created_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

-- 5) Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 6) Policies simplificadas (SEM dependências circulares)
DROP POLICY IF EXISTS profiles_select_admins_or_own ON public.profiles;
CREATE POLICY profiles_select_admins_or_own
  ON public.profiles
  FOR SELECT
  USING (
    id = auth.uid() OR role = 'admin'
  );

DROP POLICY IF EXISTS profiles_insert_admin_or_self ON public.profiles;
CREATE POLICY profiles_insert_admin_or_self
  ON public.profiles
  FOR INSERT
  WITH CHECK (
    id = auth.uid()
  );

DROP POLICY IF EXISTS profiles_update_admin_or_own ON public.profiles;
CREATE POLICY profiles_update_admin_or_own
  ON public.profiles
  FOR UPDATE
  USING (
    id = auth.uid() OR role = 'admin'
  )
  WITH CHECK (
    id = auth.uid() AND (role = 'student' OR role = (SELECT role FROM public.profiles WHERE id = auth.uid()))
  );

DROP POLICY IF EXISTS profiles_delete_admin_or_own ON public.profiles;
CREATE POLICY profiles_delete_admin_or_own
  ON public.profiles
  FOR DELETE
  USING (
    id = auth.uid() OR role = 'admin'
  );

-- 7) Permissões
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;

-- 8) Criar perfis para usuários existentes (se houver)
INSERT INTO public.profiles (id, email, full_name, role, created_at)
SELECT 
  id, 
  email, 
  COALESCE(
    raw_user_meta_data->>'name',
    raw_user_meta_data->>'full_name',
    email
  ) as full_name,
  'student' as role,
  created_at
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- Pronto! Agora você pode promover um usuário a admin:
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'seu_email@example.com';
