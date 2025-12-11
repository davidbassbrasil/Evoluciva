-- ============================================
-- FIX: Adicionar CANCELLED ao enum payment_status
-- Para suportar cancelamento de pagamentos pendentes
-- ============================================

-- Adicionar o valor CANCELLED ao enum payment_status
ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'CANCELLED';

-- Verificar os valores do enum
SELECT 
  enumlabel as valores_aceitos
FROM pg_enum
WHERE enumtypid = 'payment_status'::regtype
ORDER BY enumsortorder;

-- Resultado esperado: incluirá CANCELLED na lista
