-- Adicionar campo start_date (data de início das aulas) na tabela turmas
-- Isso permite criar múltiplas turmas do mesmo curso com datas diferentes

-- Adicionar coluna
ALTER TABLE turmas 
ADD COLUMN IF NOT EXISTS start_date DATE;

-- Criar índice para facilitar buscas por data
CREATE INDEX IF NOT EXISTS idx_turmas_start_date ON turmas(start_date);

-- Comentário explicativo
COMMENT ON COLUMN turmas.start_date IS 'Data de início das aulas da turma. Permite criar múltiplas turmas do mesmo curso com datas diferentes.';
