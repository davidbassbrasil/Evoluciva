-- RLS Policies para Refunds
-- Controle de acesso à tabela de estornos

-- Habilitar RLS
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;

-- Limpar políticas existentes
DROP POLICY IF EXISTS "Admins can view all refunds" ON refunds;
DROP POLICY IF EXISTS "Admins can insert refunds" ON refunds;
DROP POLICY IF EXISTS "Admins can update refunds" ON refunds;
DROP POLICY IF EXISTS "Users can view own payment refunds" ON refunds;

-- Admins podem ver todos os estornos
CREATE POLICY "Admins can view all refunds" ON refunds
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins podem inserir estornos
CREATE POLICY "Admins can insert refunds" ON refunds
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins podem atualizar estornos
CREATE POLICY "Admins can update refunds" ON refunds
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Usuários podem ver estornos dos próprios pagamentos
CREATE POLICY "Users can view own payment refunds" ON refunds
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM payments
      WHERE payments.id = refunds.payment_id
      AND payments.user_id = auth.uid()
    )
  );

-- Service role tem acesso total (para webhooks)
-- Não precisa de policy explícita, service_role bypassa RLS
