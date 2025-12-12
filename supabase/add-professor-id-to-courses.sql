-- Adicionar coluna professor_id à tabela courses
-- Esta coluna permite vincular um curso a um professor específico

-- Adicionar a coluna (nullable pois cursos existentes não têm professor)
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS professor_id UUID REFERENCES professors(id) ON DELETE SET NULL;

-- Criar índice para otimizar buscas
CREATE INDEX IF NOT EXISTS idx_courses_professor_id ON courses(professor_id);

-- Comentário explicativo
COMMENT ON COLUMN courses.professor_id IS 'ID do professor vinculado ao curso (opcional). Se definido, exibe informações do professor na página do curso.';
