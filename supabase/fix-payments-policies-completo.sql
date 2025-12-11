-- ============================================
-- FIX COMPLETO: Policies da tabela PAYMENTS
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- PASSO 1: Remover TODAS as policies antigas da tabela payments
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'payments') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON payments';
    END LOOP;
END $$;

-- PASSO 2: Criar policies novas e corretas

-- 1. Usuários podem criar seus próprios pagamentos
CREATE POLICY "Users can insert own payments"
ON payments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 2. ADMINS podem criar pagamentos para QUALQUER usuário
CREATE POLICY "Admins can insert payments"
ON payments
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- 3. Usuários podem ver seus próprios pagamentos
CREATE POLICY "Users can view own payments"
ON payments
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 4. Admins podem ver TODOS os pagamentos
CREATE POLICY "Admins can view all payments"
ON payments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- 5. Service role pode atualizar (para webhooks)
CREATE POLICY "Service role can update payments"
ON payments
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- 6. Admins podem atualizar qualquer pagamento
CREATE POLICY "Admins can update payments"
ON payments
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- 7. Admins podem deletar pagamentos
CREATE POLICY "Admins can delete payments"
ON payments
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- PASSO 3: Verificar policies criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as command,
  CASE 
    WHEN qual IS NOT NULL THEN 'USING definido'
    ELSE 'Sem USING'
  END as has_using,
  CASE 
    WHEN with_check IS NOT NULL THEN 'WITH CHECK definido'
    ELSE 'Sem WITH CHECK'
  END as has_with_check
FROM pg_policies
WHERE tablename = 'payments'
ORDER BY policyname;

-- PASSO 4: Testar se você é admin
SELECT 
  auth.uid() as seu_user_id,
  p.id as profile_id,
  p.role as seu_role,
  CASE 
    WHEN p.role = 'admin' THEN '✅ Você é ADMIN - pode criar pagamentos'
    ELSE '❌ Você NÃO é admin'
  END as status
FROM profiles p
WHERE p.id = auth.uid();
