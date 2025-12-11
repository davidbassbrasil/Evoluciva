-- ============================================
-- SOLUÇÃO DEFINITIVA - FORÇA ADICIONAR MODERATOR
-- ============================================

-- PASSO 1: Desabilitar a constraint temporariamente
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- PASSO 2: Adicionar 'moderator' ao enum (force)
DO $$ 
BEGIN
    BEGIN
        ALTER TYPE user_role ADD VALUE 'moderator';
        RAISE NOTICE 'Moderator adicionado!';
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'Moderator já existe!';
    END;
END $$;

-- PASSO 3: Recriar a constraint permitindo moderator
ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'student', 'moderator'));

-- PASSO 4: Policies para admins
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
CREATE POLICY "Admins can insert profiles"
ON profiles FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
CREATE POLICY "Admins can delete profiles"
ON profiles FOR DELETE TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
CREATE POLICY "Admins can update any profile"
ON profiles FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Verificar
SELECT 'PRONTO! ✅' as status, 
       array_agg(enumlabel::text ORDER BY enumlabel) as roles
FROM pg_enum
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role');
