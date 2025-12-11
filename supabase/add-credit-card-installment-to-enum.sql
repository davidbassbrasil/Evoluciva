-- ============================================
-- FIX: Adicionar CREDIT_CARD_INSTALLMENT ao enum payment_type
-- Para suportar pagamentos parcelados no cartão
-- ============================================

-- Adicionar o valor CREDIT_CARD_INSTALLMENT ao enum payment_type
ALTER TYPE payment_type ADD VALUE IF NOT EXISTS 'CREDIT_CARD_INSTALLMENT';

-- Verificar os valores do enum
SELECT 
  enumlabel as valores_aceitos
FROM pg_enum
WHERE enumtypid = 'payment_type'::regtype
ORDER BY enumsortorder;

-- Resultado esperado: CREDIT_CARD, DEBIT_CARD, PIX, BOLETO, UNDEFINED, CASH, CREDIT_CARD_INSTALLMENT
