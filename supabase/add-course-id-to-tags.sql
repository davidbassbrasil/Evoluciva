-- Adicionar coluna course_id na tabela tags para vincular a cursos
ALTER TABLE public.tags 
ADD COLUMN IF NOT EXISTS course_id uuid NULL;

-- Adicionar foreign key para garantir integridade
ALTER TABLE public.tags
ADD CONSTRAINT fk_tags_course
FOREIGN KEY (course_id) REFERENCES public.courses(id)
ON DELETE SET NULL;

-- Criar índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_tags_course_id 
ON public.tags USING btree (course_id);

-- Comentário explicativo
COMMENT ON COLUMN public.tags.course_id IS 'Referência ao curso vinculado à tag/matéria';
