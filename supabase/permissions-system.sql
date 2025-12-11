-- ============================================
-- SISTEMA DE PERMISSÕES E MODERADORES
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- PASSO 1A: Verificar enum atual
SELECT enumlabel as roles_existentes 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
ORDER BY enumlabel;

-- PASSO 1B: Adicionar role 'moderator' ao enum se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t 
                   JOIN pg_enum e ON t.oid = e.enumtypid 
                   WHERE t.typname = 'user_role' AND e.enumlabel = 'moderator') THEN
        ALTER TYPE user_role ADD VALUE 'moderator';
        RAISE NOTICE 'Role moderator adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Role moderator já existe.';
    END IF;
END $$;

-- PASSO 1C: Verificar novamente após adicionar
SELECT enumlabel as roles_apos_update 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
ORDER BY enumlabel;

-- PASSO 2: Criar tabela de permissões
CREATE TABLE IF NOT EXISTS user_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  permission_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, permission_key)
);

-- PASSO 3: Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_key ON user_permissions(permission_key);

-- PASSO 4: Habilitar RLS
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

-- PASSO 5A: Policy para admins atualizarem outros profiles
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
CREATE POLICY "Admins can update any profile"
ON profiles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'admin'
  )
);

-- PASSO 5B: Policies para user_permissions

-- Admins podem ver todas as permissões
DROP POLICY IF EXISTS "Admins can view all permissions" ON user_permissions;
CREATE POLICY "Admins can view all permissions"
ON user_permissions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Admins podem inserir permissões
DROP POLICY IF EXISTS "Admins can insert permissions" ON user_permissions;
CREATE POLICY "Admins can insert permissions"
ON user_permissions
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Admins podem deletar permissões
DROP POLICY IF EXISTS "Admins can delete permissions" ON user_permissions;
CREATE POLICY "Admins can delete permissions"
ON user_permissions
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Moderadores podem ver suas próprias permissões
DROP POLICY IF EXISTS "Users can view own permissions" ON user_permissions;
CREATE POLICY "Users can view own permissions"
ON user_permissions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- PASSO 6: Função helper para verificar permissões
CREATE OR REPLACE FUNCTION has_permission(user_uuid UUID, perm_key TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Admins têm todas as permissões
  IF EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_uuid 
    AND role = 'admin'
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Verificar se o usuário tem a permissão específica
  RETURN EXISTS (
    SELECT 1 FROM user_permissions
    WHERE user_id = user_uuid
    AND permission_key = perm_key
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASSO 7: Verificar estrutura
SELECT 
  'user_permissions table created' as status,
  COUNT(*) as total_permissions
FROM user_permissions;

-- Listar permissões disponíveis (documentação)
SELECT unnest(ARRAY[
  'dashboard',
  'banners',
  'cursos',
  'turmas',
  'aulas',
  'professores',
  'tags',
  'depoimentos',
  'faq',
  'alunos',
  'financeiro'
]) as available_permissions;
