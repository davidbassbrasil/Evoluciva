-- Remove a tabela antiga se existir (para recriar com nova estrutura)
DROP TABLE IF EXISTS financial_password CASCADE;

-- Tabela para armazenar a senha de desbloqueio dos valores financeiros
-- Cada admin pode configurar sua própria senha
CREATE TABLE financial_password (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Apenas admins podem ler e escrever
ALTER TABLE financial_password ENABLE ROW LEVEL SECURITY;

-- Policy: Admin só pode ler sua própria senha
CREATE POLICY "Admin pode ler sua própria senha"
  ON financial_password
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Admin só pode criar/atualizar sua própria senha
CREATE POLICY "Admin pode criar/atualizar sua própria senha"
  ON financial_password
  FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
