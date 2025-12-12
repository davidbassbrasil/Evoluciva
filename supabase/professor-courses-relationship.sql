-- ===================================================================
-- RELACIONAMENTO MANY-TO-MANY: PROFESSORES <-> CURSOS
-- ===================================================================
-- Um professor pode lecionar vários cursos
-- Um curso pode ter vários professores (equipe)
-- ===================================================================

-- 0. Habilitar extensão unaccent para remover acentos nos slugs
CREATE EXTENSION IF NOT EXISTS unaccent;

-- 1. Adicionar campo slug na tabela professors para URLs amigáveis
ALTER TABLE public.professors 
ADD COLUMN IF NOT EXISTS slug text NULL;

-- Criar índice único para slug
CREATE UNIQUE INDEX IF NOT EXISTS professors_slug_key 
ON public.professors USING btree (slug);

-- 2. Criar tabela de relacionamento professor_courses
CREATE TABLE IF NOT EXISTS public.professor_courses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  professor_id uuid NOT NULL,
  course_id uuid NOT NULL,
  role text NULL DEFAULT 'Instrutor',
  created_at timestamp with time zone NULL DEFAULT now(),
  
  CONSTRAINT professor_courses_pkey PRIMARY KEY (id),
  CONSTRAINT professor_courses_unique UNIQUE (professor_id, course_id),
  CONSTRAINT fk_professor_courses_professor 
    FOREIGN KEY (professor_id) 
    REFERENCES public.professors(id) 
    ON DELETE CASCADE,
  CONSTRAINT fk_professor_courses_course 
    FOREIGN KEY (course_id) 
    REFERENCES public.courses(id) 
    ON DELETE CASCADE
) TABLESPACE pg_default;

-- 3. Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_professor_courses_professor_id 
ON public.professor_courses USING btree (professor_id);

CREATE INDEX IF NOT EXISTS idx_professor_courses_course_id 
ON public.professor_courses USING btree (course_id);

-- 4. Comentários explicativos
COMMENT ON TABLE public.professor_courses IS 'Relacionamento many-to-many entre professores e cursos';
COMMENT ON COLUMN public.professor_courses.role IS 'Papel do professor no curso (ex: Instrutor, Coordenador, etc)';
COMMENT ON COLUMN public.professors.slug IS 'URL amigável para página do professor (ex: joao-silva)';

-- 5. Habilitar RLS
ALTER TABLE public.professor_courses ENABLE ROW LEVEL SECURITY;

-- 6. Políticas RLS para professor_courses
-- Leitura pública
DROP POLICY IF EXISTS "Allow public read access to professor_courses" ON public.professor_courses;
CREATE POLICY "Allow public read access to professor_courses" 
ON public.professor_courses 
FOR SELECT 
USING (true);

-- Admin/Moderador pode fazer tudo
DROP POLICY IF EXISTS "Allow admin/moderator full access to professor_courses" ON public.professor_courses;
CREATE POLICY "Allow admin/moderator full access to professor_courses" 
ON public.professor_courses 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'moderator')
  )
);

-- 7. Função para gerar slug automaticamente (se não fornecido)
CREATE OR REPLACE FUNCTION generate_professor_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := regexp_replace(
      lower(unaccent(NEW.name)),
      '[^a-z0-9]+',
      '-',
      'g'
    );
    NEW.slug := trim(both '-' from NEW.slug);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Trigger para gerar slug
DROP TRIGGER IF EXISTS trigger_generate_professor_slug ON public.professors;
CREATE TRIGGER trigger_generate_professor_slug
BEFORE INSERT OR UPDATE ON public.professors
FOR EACH ROW
EXECUTE FUNCTION generate_professor_slug();
