-- Fix: Permitir que admins criem e atualizem pagamentos
-- Execute este script no SQL Editor do Supabase

-- Remover policies antigas se existirem
DROP POLICY IF EXISTS "Admins can insert payments" ON payments;
DROP POLICY IF EXISTS "Admins can update payments" ON payments;

-- 1. Permitir que admins criem pagamentos para qualquer usuário
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

-- 2. Permitir que admins atualizem qualquer pagamento
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

-- Verificar políticas criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'payments'
ORDER BY policyname;
