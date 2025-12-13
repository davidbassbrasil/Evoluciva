-- Permitir que alunos leiam módulos que foram entregues para eles
DROP POLICY IF EXISTS "Alunos podem ver módulos entregues a eles" ON modules;
CREATE POLICY "Alunos podem ver módulos entregues a eles"
  ON modules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM module_deliveries
      WHERE module_deliveries.module_id = modules.id
      AND module_deliveries.student_id = auth.uid()
    )
  );

-- Permitir que alunos leiam turmas de módulos entregues a eles
DROP POLICY IF EXISTS "Alunos podem ver turmas de módulos entregues" ON turmas;
CREATE POLICY "Alunos podem ver turmas de módulos entregues"
  ON turmas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM modules m
      INNER JOIN module_deliveries md ON md.module_id = m.id
      WHERE m.turma_id = turmas.id
      AND md.student_id = auth.uid()
    )
  );
