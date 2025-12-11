-- ============================================
-- FIX: Tornar asaas_payment_id NULLABLE
-- Pagamentos em caixa local não têm ID do Asaas
-- ============================================

-- Alterar a coluna para permitir NULL
ALTER TABLE payments 
ALTER COLUMN asaas_payment_id DROP NOT NULL;

-- Verificar a alteração
SELECT 
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_name = 'payments' 
  AND column_name = 'asaas_payment_id';

-- Resultado esperado: is_nullable = 'YES'
