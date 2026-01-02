-- Adicionar campo coupon_active à tabela turmas
-- Este campo controla se o cupom da turma está ativo ou não

ALTER TABLE turmas 
ADD COLUMN IF NOT EXISTS coupon_active BOOLEAN DEFAULT true;

-- Comentário descritivo
COMMENT ON COLUMN turmas.coupon_active IS 'Indica se o cupom da turma está ativo e pode ser usado';
