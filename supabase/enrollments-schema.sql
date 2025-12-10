-- Tabela de Matrículas (Enrollments)
-- Vincula alunos (profiles) a turmas específicas

CREATE TABLE IF NOT EXISTS enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  turma_id UUID NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
  modality TEXT NOT NULL DEFAULT 'presential', -- 'presential' ou 'online'
  
  -- Informações de pagamento
  payment_status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'free', 'cancelled', 'refunded'
  payment_method TEXT, -- 'credit_card', 'pix', 'boleto', 'debit_card', 'free'
  payment_id TEXT, -- ID do pagamento no gateway (Asaas)
  amount_paid NUMERIC(10, 2) DEFAULT 0,
  coupon_used TEXT, -- Cupom utilizado (se houver)
  
  -- Datas
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE,
  access_expires_at TIMESTAMP WITH TIME ZONE, -- Data de expiração do acesso
  
  -- Controle
  created_by UUID REFERENCES profiles(id), -- Quem criou a matrícula (admin ou próprio aluno via checkout)
  notes TEXT, -- Observações internas do admin
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Garante que um aluno não se matricule duas vezes na mesma turma com mesma modalidade
  UNIQUE(profile_id, turma_id, modality)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_enrollments_profile ON enrollments(profile_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_turma ON enrollments(turma_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_payment_status ON enrollments(payment_status);
CREATE INDEX IF NOT EXISTS idx_enrollments_enrolled_at ON enrollments(enrolled_at DESC);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_enrollments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enrollments_updated_at ON enrollments;
CREATE TRIGGER enrollments_updated_at
  BEFORE UPDATE ON enrollments
  FOR EACH ROW
  EXECUTE FUNCTION update_enrollments_updated_at();

-- RLS Policies
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- Todos podem ver (para simplificar; em produção, restringir)
DROP POLICY IF EXISTS "enrollments_select_all" ON enrollments;
CREATE POLICY "enrollments_select_all" ON enrollments FOR SELECT USING (true);

DROP POLICY IF EXISTS "enrollments_insert_all" ON enrollments;
CREATE POLICY "enrollments_insert_all" ON enrollments FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "enrollments_update_all" ON enrollments;
CREATE POLICY "enrollments_update_all" ON enrollments FOR UPDATE USING (true);

DROP POLICY IF EXISTS "enrollments_delete_all" ON enrollments;
CREATE POLICY "enrollments_delete_all" ON enrollments FOR DELETE USING (true);

-- Comentários
COMMENT ON TABLE enrollments IS 'Matrículas de alunos em turmas';
COMMENT ON COLUMN enrollments.modality IS 'Modalidade: presential ou online';
COMMENT ON COLUMN enrollments.payment_status IS 'Status: pending, paid, free, cancelled, refunded';
COMMENT ON COLUMN enrollments.access_expires_at IS 'Data em que o acesso expira (herdado de turma ou customizado)';
