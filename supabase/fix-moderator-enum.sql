-- ============================================
-- FIX: Adicionar 'moderator' ao enum user_role
-- Execute APENAS este SQL se continuar com erro
-- ============================================

-- OPÇÃO 1: Tentar adicionar moderator diretamente
DO $$ 
BEGIN
    -- Tenta adicionar se não existir
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'user_role' 
        AND e.enumlabel = 'moderator'
    ) THEN
        ALTER TYPE user_role ADD VALUE 'moderator';
        RAISE NOTICE '✓ Role moderator adicionada!';
    ELSE
        RAISE NOTICE '✓ Role moderator já existe!';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao adicionar moderator: %', SQLERRM;
END $$;

-- Verificar resultado
SELECT 
    'Roles disponíveis no sistema:' as info,
    array_agg(enumlabel::text ORDER BY enumlabel) as roles
FROM pg_enum
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role');

-- Se o resultado NÃO mostrar 'moderator', execute APENAS o bloco abaixo:
-- DESCOMENTE as linhas abaixo se precisar recriar o tipo completamente

/*
-- ⚠️ ATENÇÃO: Isso vai remover a constraint temporariamente
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Recriar o enum (se não funcionar o ADD VALUE)
DROP TYPE IF EXISTS user_role CASCADE;
CREATE TYPE user_role AS ENUM ('admin', 'student', 'moderator');

-- Recriar a constraint
ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'student', 'moderator'));

-- Verificar
SELECT 'Constraint recriada com sucesso!' as status;
*/
