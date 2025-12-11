-- ============================================
-- FIX: Adicionar CASH ao enum payment_type
-- Para suportar pagamentos em caixa local
-- ============================================

-- Adicionar o valor CASH ao enum payment_type
ALTER TYPE payment_type ADD VALUE IF NOT EXISTS 'CASH';

-- Verificar os valores do enum
SELECT 
  enumlabel as valores_aceitos
FROM pg_enum
WHERE enumtypid = 'payment_type'::regtype
ORDER BY enumsortorder;

-- Resultado esperado: CREDIT_CARD, DEBIT_CARD, PIX, BOLETO, UNDEFINED, CASH
