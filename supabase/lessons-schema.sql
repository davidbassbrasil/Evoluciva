-- Tabela de Aulas (Lessons)
-- Esta tabela gerencia as aulas de cada turma, organizadas por módulos

CREATE TABLE IF NOT EXISTS lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  turma_id UUID NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
  
  -- Organização
  module_title TEXT NOT NULL, -- Título do módulo (ex: "Módulo 1 - Introdução")
  lesson_title TEXT NOT NULL, -- Título da aula
  lesson_order INTEGER NOT NULL DEFAULT 1, -- Ordem da aula dentro do módulo
  
  -- Conteúdo
  video_url TEXT NOT NULL, -- URL do vídeo (YouTube ou Vimeo)
  material_link TEXT, -- Link opcional para material de apoio
  description TEXT, -- Descrição opcional da aula
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_lessons_turma_id ON lessons(turma_id);
CREATE INDEX IF NOT EXISTS idx_lessons_module_order ON lessons(turma_id, module_title, lesson_order);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_lessons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS lessons_updated_at ON lessons;
CREATE TRIGGER lessons_updated_at
  BEFORE UPDATE ON lessons
  FOR EACH ROW
  EXECUTE FUNCTION update_lessons_updated_at();

-- RLS Policies
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- Admins podem fazer tudo
DROP POLICY IF EXISTS "lessons_admin_all" ON lessons;
CREATE POLICY "lessons_admin_all" ON lessons 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Todos podem ver as aulas (necessário para alunos)
DROP POLICY IF EXISTS "lessons_select_all" ON lessons;
CREATE POLICY "lessons_select_all" ON lessons 
  FOR SELECT 
  USING (true);

-- Permitir insert/update/delete para autenticados (será refinado depois)
DROP POLICY IF EXISTS "lessons_insert_authenticated" ON lessons;
CREATE POLICY "lessons_insert_authenticated" ON lessons 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "lessons_update_authenticated" ON lessons;
CREATE POLICY "lessons_update_authenticated" ON lessons 
  FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "lessons_delete_authenticated" ON lessons;
CREATE POLICY "lessons_delete_authenticated" ON lessons 
  FOR DELETE 
  USING (auth.uid() IS NOT NULL);

-- Comentários nas colunas
COMMENT ON TABLE lessons IS 'Aulas organizadas por turma e módulos';
COMMENT ON COLUMN lessons.turma_id IS 'Referência à turma';
COMMENT ON COLUMN lessons.module_title IS 'Título do módulo (ex: Módulo 1 - Introdução)';
COMMENT ON COLUMN lessons.lesson_title IS 'Título da aula';
COMMENT ON COLUMN lessons.lesson_order IS 'Ordem da aula dentro do módulo';
COMMENT ON COLUMN lessons.video_url IS 'URL do vídeo (YouTube ou Vimeo)';
COMMENT ON COLUMN lessons.material_link IS 'Link para material de apoio (PDF, etc)';
COMMENT ON COLUMN lessons.description IS 'Descrição da aula';
