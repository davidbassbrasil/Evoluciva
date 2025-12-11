-- Tabela de Estornos (Refunds)
-- Gerencia estornos totais ou parciais de pagamentos

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

-- Índices
CREATE INDEX idx_refunds_payment_id ON refunds(payment_id);
CREATE INDEX idx_refunds_status ON refunds(status);
CREATE INDEX idx_refunds_created_at ON refunds(created_at DESC);

-- Trigger para atualizar updated_at
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

-- Function para calcular total de estornos de um pagamento
CREATE OR REPLACE FUNCTION get_payment_refunded_amount(payment_uuid UUID)
RETURNS NUMERIC AS $$
  SELECT COALESCE(SUM(refund_value), 0)
  FROM refunds
  WHERE payment_id = payment_uuid
    AND status IN ('COMPLETED', 'PROCESSING');
$$ LANGUAGE sql STABLE;

-- Function para verificar se pagamento pode ser estornado
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

-- Comentários
COMMENT ON TABLE refunds IS 'Tabela de estornos totais ou parciais de pagamentos';
COMMENT ON COLUMN refunds.refund_value IS 'Valor do estorno em Reais';
COMMENT ON COLUMN refunds.reason IS 'Motivo do estorno (obrigatório)';
COMMENT ON COLUMN refunds.description IS 'Descrição detalhada do estorno';
COMMENT ON COLUMN refunds.approved_by IS 'Admin que aprovou o estorno';
