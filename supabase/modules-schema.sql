-- ============================================
-- MÓDULOS - SISTEMA DE CONTROLE DE ENTREGAS
-- ============================================

-- Tabela de Módulos (estoque de módulos por turma)
CREATE TABLE IF NOT EXISTS modules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  turma_id UUID NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_modules_turma_id ON modules(turma_id);
CREATE INDEX IF NOT EXISTS idx_modules_created_at ON modules(created_at);

-- Tabela de Entregas de Módulos (registro de entrega para cada aluno)
CREATE TABLE IF NOT EXISTS module_deliveries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  delivered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered_by UUID NOT NULL REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevenir duplicatas: um aluno só pode receber o mesmo módulo uma vez
  UNIQUE(module_id, student_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_module_deliveries_module_id ON module_deliveries(module_id);
CREATE INDEX IF NOT EXISTS idx_module_deliveries_student_id ON module_deliveries(student_id);
CREATE INDEX IF NOT EXISTS idx_module_deliveries_delivered_at ON module_deliveries(delivered_at);

-- Function para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_modules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
DROP TRIGGER IF EXISTS modules_updated_at ON modules;
CREATE TRIGGER modules_updated_at
  BEFORE UPDATE ON modules
  FOR EACH ROW
  EXECUTE FUNCTION update_modules_updated_at();

DROP TRIGGER IF EXISTS module_deliveries_updated_at ON module_deliveries;
CREATE TRIGGER module_deliveries_updated_at
  BEFORE UPDATE ON module_deliveries
  FOR EACH ROW
  EXECUTE FUNCTION update_modules_updated_at();

-- ============================================
-- RLS POLICIES
-- ============================================

-- Habilitar RLS
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_deliveries ENABLE ROW LEVEL SECURITY;

-- Policies para MODULES
-- Admin e Moderadores podem ver todos os módulos
DROP POLICY IF EXISTS "Admin e Moderadores podem ver módulos" ON modules;
CREATE POLICY "Admin e Moderadores podem ver módulos"
  ON modules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'moderator')
    )
  );

-- Admin e Moderadores podem inserir módulos
DROP POLICY IF EXISTS "Admin e Moderadores podem inserir módulos" ON modules;
CREATE POLICY "Admin e Moderadores podem inserir módulos"
  ON modules FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'moderator')
    )
  );

-- Admin e Moderadores podem atualizar módulos
DROP POLICY IF EXISTS "Admin e Moderadores podem atualizar módulos" ON modules;
CREATE POLICY "Admin e Moderadores podem atualizar módulos"
  ON modules FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'moderator')
    )
  );

-- Admin e Moderadores podem deletar módulos
DROP POLICY IF EXISTS "Admin e Moderadores podem deletar módulos" ON modules;
CREATE POLICY "Admin e Moderadores podem deletar módulos"
  ON modules FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'moderator')
    )
  );

-- Policies para MODULE_DELIVERIES
-- Admin e Moderadores podem ver todas as entregas
DROP POLICY IF EXISTS "Admin e Moderadores podem ver entregas" ON module_deliveries;
CREATE POLICY "Admin e Moderadores podem ver entregas"
  ON module_deliveries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'moderator')
    )
  );

-- Admin e Moderadores podem registrar entregas
DROP POLICY IF EXISTS "Admin e Moderadores podem registrar entregas" ON module_deliveries;
CREATE POLICY "Admin e Moderadores podem registrar entregas"
  ON module_deliveries FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'moderator')
    )
  );

-- Admin e Moderadores podem atualizar entregas
DROP POLICY IF EXISTS "Admin e Moderadores podem atualizar entregas" ON module_deliveries;
CREATE POLICY "Admin e Moderadores podem atualizar entregas"
  ON module_deliveries FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'moderator')
    )
  );

-- Admin e Moderadores podem deletar entregas
DROP POLICY IF EXISTS "Admin e Moderadores podem deletar entregas" ON module_deliveries;
CREATE POLICY "Admin e Moderadores podem deletar entregas"
  ON module_deliveries FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'moderator')
    )
  );

-- Alunos podem ver suas próprias entregas
DROP POLICY IF EXISTS "Alunos podem ver suas entregas" ON module_deliveries;
CREATE POLICY "Alunos podem ver suas entregas"
  ON module_deliveries FOR SELECT
  USING (student_id = auth.uid());

-- ============================================
-- VIEW AUXILIAR
-- ============================================

-- View para facilitar queries de módulos com informações agregadas
CREATE OR REPLACE VIEW modules_with_stats AS
SELECT 
  m.*,
  t.name as turma_name,
  t.course_id,
  c.title as course_title,
  COUNT(DISTINCT md.id) as delivered_count,
  m.stock_quantity - COUNT(DISTINCT md.id) as available_count,
  (
    SELECT COUNT(DISTINCT e.profile_id)
    FROM enrollments e
    WHERE e.turma_id = m.turma_id
    AND e.payment_status = 'paid'
  ) as total_students
FROM modules m
LEFT JOIN turmas t ON t.id = m.turma_id
LEFT JOIN courses c ON c.id = t.course_id
LEFT JOIN module_deliveries md ON md.module_id = m.id
GROUP BY m.id, t.name, t.course_id, c.title;

-- ============================================
-- COMENTÁRIOS
-- ============================================

COMMENT ON TABLE modules IS 'Armazena os módulos físicos disponíveis para entrega por turma';
COMMENT ON TABLE module_deliveries IS 'Registra as entregas de módulos para os alunos';
COMMENT ON COLUMN modules.stock_quantity IS 'Quantidade total de módulos em estoque';
COMMENT ON COLUMN module_deliveries.delivered_by IS 'Usuário (admin/moderador) que realizou a entrega';
