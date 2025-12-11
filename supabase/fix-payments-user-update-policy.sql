-- ============================================
-- ADICIONAR POLICY: Usuários podem atualizar seus próprios pagamentos
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- Adicionar policy para usuários atualizarem seus próprios pagamentos
-- (especialmente para cancelar pagamentos pendentes)
CREATE POLICY "Users can update own payments"
ON payments
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Verificar policies da tabela payments
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'payments'
ORDER BY policyname;
