-- Script completo para setup do sistema de estornos
-- Execute este script no SQL Editor do Supabase

-- 1. Criar tabela de estornos
DROP TABLE IF EXISTS refunds CASCADE;

CREATE TABLE refunds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  
  -- Valor do estorno
  refund_value NUMERIC(10, 2) NOT NULL CHECK (refund_value > 0),
  
  -- Informações do estorno
  reason TEXT NOT NULL, -- Motivo do estorno
  description TEXT, -- Descrição detalhada
  
  -- Status do estorno
  status TEXT DEFAULT 'PENDING' CHECK (status IN (
    'PENDING',      -- Pendente de aprovação
    'APPROVED',     -- Aprovado
    'PROCESSING',   -- Processando
    'COMPLETED',    -- Concluído
    'FAILED',       -- Falhou
    'CANCELLED'     -- Cancelado
  )),
  
  -- Dados adicionais
  asaas_refund_id TEXT, -- ID do estorno na Asaas (se aplicável)
  refund_date TIMESTAMP WITH TIME ZONE, -- Data de conclusão do estorno
  approved_by UUID REFERENCES auth.users(id), -- Admin que aprovou
  approved_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadados
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar índices
CREATE INDEX idx_refunds_payment_id ON refunds(payment_id);
CREATE INDEX idx_refunds_status ON refunds(status);
CREATE INDEX idx_refunds_created_at ON refunds(created_at DESC);

-- 3. Criar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_refunds_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS refunds_updated_at ON refunds;
CREATE TRIGGER refunds_updated_at
  BEFORE UPDATE ON refunds
  FOR EACH ROW
  EXECUTE FUNCTION update_refunds_updated_at();

-- 4. Criar functions auxiliares
CREATE OR REPLACE FUNCTION get_payment_refunded_amount(payment_uuid UUID)
RETURNS NUMERIC AS $$
  SELECT COALESCE(SUM(refund_value), 0)
  FROM refunds
  WHERE payment_id = payment_uuid
    AND status IN ('COMPLETED', 'PROCESSING');
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION can_refund_payment(payment_uuid UUID, refund_amount NUMERIC)
RETURNS BOOLEAN AS $$
DECLARE
  payment_value NUMERIC;
  already_refunded NUMERIC;
BEGIN
  -- Buscar valor do pagamento
  SELECT value INTO payment_value
  FROM payments
  WHERE id = payment_uuid;
  
  -- Calcular valor já estornado
  already_refunded := get_payment_refunded_amount(payment_uuid);
  
  -- Verificar se o novo estorno não excede o valor do pagamento
  RETURN (already_refunded + refund_amount) <= payment_value;
END;
$$ LANGUAGE plpgsql STABLE;

-- 5. Habilitar RLS
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;

-- 6. Criar políticas RLS
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

-- 7. Comentários
COMMENT ON TABLE refunds IS 'Tabela de estornos totais ou parciais de pagamentos';
COMMENT ON COLUMN refunds.refund_value IS 'Valor do estorno em Reais';
COMMENT ON COLUMN refunds.reason IS 'Motivo do estorno (obrigatório)';
COMMENT ON COLUMN refunds.description IS 'Descrição detalhada do estorno';
COMMENT ON COLUMN refunds.approved_by IS 'Admin que aprovou o estorno';

-- Finalizado!
SELECT 'Sistema de estornos configurado com sucesso!' as status;
