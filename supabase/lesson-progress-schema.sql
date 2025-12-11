-- Tabela de Progresso das Aulas
-- Registra o progresso do aluno em cada aula

CREATE TABLE IF NOT EXISTS lesson_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  last_watched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint para garantir apenas um registro por aluno/aula
  UNIQUE(profile_id, lesson_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_lesson_progress_profile ON lesson_progress(profile_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson ON lesson_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_completed ON lesson_progress(profile_id, completed);

-- RLS Policies
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;

-- Usuários só podem ver/editar seu próprio progresso
DROP POLICY IF EXISTS "lesson_progress_select_own" ON lesson_progress;
CREATE POLICY "lesson_progress_select_own" ON lesson_progress 
  FOR SELECT 
  USING (profile_id = auth.uid());

DROP POLICY IF EXISTS "lesson_progress_insert_own" ON lesson_progress;
CREATE POLICY "lesson_progress_insert_own" ON lesson_progress 
  FOR INSERT 
  WITH CHECK (profile_id = auth.uid());

DROP POLICY IF EXISTS "lesson_progress_update_own" ON lesson_progress;
CREATE POLICY "lesson_progress_update_own" ON lesson_progress 
  FOR UPDATE 
  USING (profile_id = auth.uid());

-- Admins podem ver tudo
DROP POLICY IF EXISTS "lesson_progress_admin_all" ON lesson_progress;
CREATE POLICY "lesson_progress_admin_all" ON lesson_progress 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Comentários
COMMENT ON TABLE lesson_progress IS 'Progresso dos alunos nas aulas';
COMMENT ON COLUMN lesson_progress.completed IS 'Se a aula foi marcada como concluída';
COMMENT ON COLUMN lesson_progress.last_watched_at IS 'Última vez que o aluno assistiu a aula';
