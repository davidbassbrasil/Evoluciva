-- Criar tabela de relacionamento many-to-many para upsells de cursos
-- Um curso pode ter vários cursos como upsell
-- Um curso pode ser upsell de vários outros cursos

CREATE TABLE IF NOT EXISTS public.course_upsells (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL,
  upsell_course_id uuid NOT NULL,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone NULL DEFAULT now(),
  
  CONSTRAINT course_upsells_pkey PRIMARY KEY (id),
  CONSTRAINT course_upsells_unique UNIQUE (course_id, upsell_course_id),
  CONSTRAINT fk_course_upsells_course 
    FOREIGN KEY (course_id) 
    REFERENCES public.courses(id) 
    ON DELETE CASCADE,
  CONSTRAINT fk_course_upsells_upsell 
    FOREIGN KEY (upsell_course_id) 
    REFERENCES public.courses(id) 
    ON DELETE CASCADE,
  CONSTRAINT course_upsells_no_self_reference 
    CHECK (course_id != upsell_course_id)
) TABLESPACE pg_default;

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_course_upsells_course_id 
ON public.course_upsells USING btree (course_id);

CREATE INDEX IF NOT EXISTS idx_course_upsells_upsell_course_id 
ON public.course_upsells USING btree (upsell_course_id);

-- RLS Policies
ALTER TABLE public.course_upsells ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública (qualquer um pode ver upsells)
DROP POLICY IF EXISTS "Allow public read access to course_upsells" ON public.course_upsells;
CREATE POLICY "Allow public read access to course_upsells"
ON public.course_upsells FOR SELECT
TO public
USING (true);

-- Política para admin/moderador gerenciar upsells
DROP POLICY IF EXISTS "Allow admin and moderator full access to course_upsells" ON public.course_upsells;
CREATE POLICY "Allow admin and moderator full access to course_upsells"
ON public.course_upsells FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'moderator')
  )
);

-- Comentários
COMMENT ON TABLE public.course_upsells IS 'Relacionamento many-to-many de cursos como upsell/cross-sell no carrinho';
COMMENT ON COLUMN public.course_upsells.display_order IS 'Ordem de exibição dos upsells (menor número = maior prioridade)';
