-- Table to store refunds specific to Caixa Local (enrollments)
-- Insert this migration into your Supabase database to allow local enrollment refunds

DROP TABLE IF EXISTS enrollment_refunds CASCADE;

CREATE TABLE enrollment_refunds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  refund_value NUMERIC(10,2) NOT NULL CHECK (refund_value > 0),
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'COMPLETED' CHECK (status IN ('PENDING','APPROVED','PROCESSING','COMPLETED','FAILED','CANCELLED')),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  refund_date TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_enrollment_refunds_enrollment_id ON enrollment_refunds(enrollment_id);
CREATE INDEX idx_enrollment_refunds_status ON enrollment_refunds(status);
CREATE INDEX idx_enrollment_refunds_created_at ON enrollment_refunds(created_at DESC);

CREATE OR REPLACE FUNCTION update_enrollment_refunds_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enrollment_refunds_updated_at ON enrollment_refunds;
CREATE TRIGGER enrollment_refunds_updated_at
  BEFORE UPDATE ON enrollment_refunds
  FOR EACH ROW
  EXECUTE FUNCTION update_enrollment_refunds_updated_at();

COMMENT ON TABLE enrollment_refunds IS 'Estornos (refunds) específicos para pagamentos de Caixa Local (registrados em enrollments).';
COMMENT ON COLUMN enrollment_refunds.refund_value IS 'Valor do estorno em Reais';
COMMENT ON COLUMN enrollment_refunds.reason IS 'Motivo do estorno (obrigatório)';
COMMENT ON COLUMN enrollment_refunds.approved_by IS 'Admin que aprovou o estorno';
