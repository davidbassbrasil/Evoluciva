-- Adicionar campos de confirmação do aluno na tabela module_deliveries
ALTER TABLE module_deliveries 
ADD COLUMN IF NOT EXISTS student_confirmed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;

-- Comentários
COMMENT ON COLUMN module_deliveries.student_confirmed IS 'Indica se o aluno confirmou o recebimento do módulo';
COMMENT ON COLUMN module_deliveries.confirmed_at IS 'Data e hora em que o aluno confirmou o recebimento';
