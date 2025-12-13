-- Permitir que alunos atualizem apenas os campos de confirmação de suas próprias entregas
DROP POLICY IF EXISTS "Alunos podem confirmar suas entregas" ON module_deliveries;
CREATE POLICY "Alunos podem confirmar suas entregas"
  ON module_deliveries FOR UPDATE
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());
