-- Políticas RLS para tabela PAYMENTS
-- Permitir que usuários autenticados criem e visualizem seus próprios pagamentos

-- Remover políticas existentes primeiro
DROP POLICY IF EXISTS "Users can insert own payments" ON payments;
DROP POLICY IF EXISTS "Users can view own payments" ON payments;
DROP POLICY IF EXISTS "Service role can update payments" ON payments;
DROP POLICY IF EXISTS "Admins can view all payments" ON payments;
DROP POLICY IF EXISTS "Admins can delete payments" ON payments;

-- 1. Permitir INSERT: Usuários podem criar seus próprios registros de pagamento
CREATE POLICY "Users can insert own payments"
ON payments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 2. Permitir SELECT: Usuários podem ver seus próprios pagamentos
CREATE POLICY "Users can view own payments"
ON payments
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 3. Permitir UPDATE: Apenas service role (para webhooks atualizarem status)
CREATE POLICY "Service role can update payments"
ON payments
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- 4. Permitir SELECT para admins (role = 'admin' no profiles)
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

-- 5. Permitir DELETE apenas para admins
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
