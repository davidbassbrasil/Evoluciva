-- Tabela de Turmas (Classes)
-- Esta tabela gerencia as turmas/ofertas de cursos com controle de vendas

CREATE TABLE IF NOT EXISTS turmas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  
  -- Datas de controle
  sale_start_date DATE,
  sale_end_date DATE,
  access_end_date DATE,
  
  -- Vagas
  presential_slots INTEGER DEFAULT 0,
  online_slots INTEGER DEFAULT 0,
  
  -- Preços
  price NUMERIC(10, 2) DEFAULT 0,
  original_price NUMERIC(10, 2) DEFAULT 0,
  
  -- Status: 'active', 'coming_soon', 'inactive'
  status TEXT DEFAULT 'active',
  
  -- Formas de pagamento
  allow_credit_card BOOLEAN DEFAULT true,
  allow_installments BOOLEAN DEFAULT true,
  max_installments INTEGER DEFAULT 12,
  allow_debit_card BOOLEAN DEFAULT true,
  allow_pix BOOLEAN DEFAULT true,
  allow_boleto BOOLEAN DEFAULT true,
  
  -- Descontos por forma de pagamento (percentual)
  discount_cash NUMERIC(5, 2) DEFAULT 0,
  discount_pix NUMERIC(5, 2) DEFAULT 0,
  discount_debit NUMERIC(5, 2) DEFAULT 0,
  
  -- Cupom promocional
  coupon_code TEXT,
  coupon_discount NUMERIC(5, 2) DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_turmas_course_id ON turmas(course_id);
CREATE INDEX IF NOT EXISTS idx_turmas_status ON turmas(status);
CREATE INDEX IF NOT EXISTS idx_turmas_sale_dates ON turmas(sale_start_date, sale_end_date);
CREATE INDEX IF NOT EXISTS idx_turmas_coupon ON turmas(coupon_code) WHERE coupon_code IS NOT NULL;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_turmas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS turmas_updated_at ON turmas;
CREATE TRIGGER turmas_updated_at
  BEFORE UPDATE ON turmas
  FOR EACH ROW
  EXECUTE FUNCTION update_turmas_updated_at();

-- RLS Policies (permissivo para desenvolvimento)
ALTER TABLE turmas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "turmas_select_all" ON turmas;
CREATE POLICY "turmas_select_all" ON turmas FOR SELECT USING (true);

DROP POLICY IF EXISTS "turmas_insert_all" ON turmas;
CREATE POLICY "turmas_insert_all" ON turmas FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "turmas_update_all" ON turmas;
CREATE POLICY "turmas_update_all" ON turmas FOR UPDATE USING (true);

DROP POLICY IF EXISTS "turmas_delete_all" ON turmas;
CREATE POLICY "turmas_delete_all" ON turmas FOR DELETE USING (true);

-- Comentários nas colunas
COMMENT ON TABLE turmas IS 'Turmas/ofertas de cursos com controle de vendas e acesso';
COMMENT ON COLUMN turmas.sale_start_date IS 'Data de início das vendas';
COMMENT ON COLUMN turmas.sale_end_date IS 'Data de fim das vendas';
COMMENT ON COLUMN turmas.access_end_date IS 'Data em que o aluno perde acesso ao curso';
COMMENT ON COLUMN turmas.presential_slots IS 'Número de vagas presenciais (0 = ilimitado)';
COMMENT ON COLUMN turmas.online_slots IS 'Número de vagas online (0 = ilimitado)';
COMMENT ON COLUMN turmas.status IS 'Status: active (vendas ativas), coming_soon (em breve), inactive';
COMMENT ON COLUMN turmas.coupon_discount IS 'Desconto do cupom em percentual (100 = gratuito)';
