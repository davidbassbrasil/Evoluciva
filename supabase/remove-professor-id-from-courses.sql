-- Remover coluna professor_id da tabela courses
-- Agora usamos a tabela professor_courses para relacionamento many-to-many

-- Remover índice primeiro
DROP INDEX IF EXISTS idx_courses_professor_id;

-- Remover coluna
ALTER TABLE courses 
DROP COLUMN IF EXISTS professor_id;
