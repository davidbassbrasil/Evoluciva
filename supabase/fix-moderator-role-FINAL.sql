-- ============================================
-- FIX DEFINITIVO: Adicionar 'moderator' ao enum
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- Verificar se moderator já existe
SELECT 
    'Estado atual do enum user_role:' as info,
    array_agg(enumlabel::text ORDER BY enumsortorder) as roles_existentes
FROM pg_enum
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role');

-- Adicionar moderator se não existir
DO $$ 
BEGIN
    -- Verificar se já existe
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'user_role' 
        AND e.enumlabel = 'moderator'
    ) THEN
        -- Adicionar o valor
        ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'moderator';
        RAISE NOTICE '✓ Role moderator foi adicionada ao enum!';
    ELSE
        RAISE NOTICE '✓ Role moderator já existe no enum!';
    END IF;
END $$;

-- Verificar resultado final
SELECT 
    '✓ Estado final do enum user_role:' as resultado,
    array_agg(enumlabel::text ORDER BY enumsortorder) as roles_disponiveis
FROM pg_enum
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role');

-- Criar/atualizar policy para admins poderem atualizar profiles
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

-- Policy para admins poderem INSERIR profiles
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
CREATE POLICY "Admins can insert profiles"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'admin'
  )
);

-- Policy para admins poderem DELETAR profiles
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
CREATE POLICY "Admins can delete profiles"
ON profiles
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'admin'
  )
);

-- Mensagem final
SELECT '✅ Configuração completa! Agora você pode criar usuários admin/moderador em /admin/acesso' as status;
