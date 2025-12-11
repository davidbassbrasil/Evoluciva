-- Políticas RLS para tabela WEBHOOK_LOGS
-- Apenas service role pode inserir/atualizar (Edge Functions)
-- Admins podem visualizar

-- Remover políticas existentes primeiro
DROP POLICY IF EXISTS "Service role can insert webhook logs" ON webhook_logs;
DROP POLICY IF EXISTS "Service role can update webhook logs" ON webhook_logs;
DROP POLICY IF EXISTS "Admins can view webhook logs" ON webhook_logs;
DROP POLICY IF EXISTS "Service role can view all webhook logs" ON webhook_logs;

-- 1. Service role pode inserir webhook logs
CREATE POLICY "Service role can insert webhook logs"
ON webhook_logs
FOR INSERT
TO service_role
WITH CHECK (true);

-- 2. Service role pode atualizar webhook logs
CREATE POLICY "Service role can update webhook logs"
ON webhook_logs
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- 3. Admins podem visualizar webhook logs
CREATE POLICY "Admins can view webhook logs"
ON webhook_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- 4. Service role pode visualizar todos os logs
CREATE POLICY "Service role can view all webhook logs"
ON webhook_logs
FOR SELECT
TO service_role
USING (true);
