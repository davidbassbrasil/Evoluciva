-- ============================================================================
-- TABELA DE PAGAMENTOS (payments)
-- Registra todos os pagamentos realizados via Asaas
-- ============================================================================

-- Dropar tabela se existir (limpeza completa)
DROP TABLE IF EXISTS payments CASCADE;

-- Dropar ENUMs se existirem (para re-criação limpa)
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS payment_type CASCADE;

-- Criar ENUM para status de pagamento
CREATE TYPE payment_status AS ENUM (
    'PENDING',           -- Aguardando pagamento
    'RECEIVED',          -- Pagamento recebido
    'CONFIRMED',         -- Pagamento confirmado
    'OVERDUE',           -- Vencido
    'REFUNDED',          -- Reembolsado
    'RECEIVED_IN_CASH',  -- Recebido em dinheiro
    'REFUND_REQUESTED',  -- Reembolso solicitado
    'CHARGEBACK_REQUESTED', -- Chargeback solicitado
    'CHARGEBACK_DISPUTE',   -- Disputa de chargeback
    'AWAITING_CHARGEBACK_REVERSAL', -- Aguardando reversão de chargeback
    'DUNNING_REQUESTED', -- Cobrança solicitada
    'DUNNING_RECEIVED',  -- Cobrança recebida
    'AWAITING_RISK_ANALYSIS' -- Aguardando análise de risco
);

-- Criar ENUM para tipo de pagamento
CREATE TYPE payment_type AS ENUM (
    'CREDIT_CARD',
    'DEBIT_CARD',
    'PIX',
    'BOLETO',
    'UNDEFINED'
);

-- Criar tabela de pagamentos
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Referências
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    turma_id UUID REFERENCES turmas(id) ON DELETE SET NULL,
    enrollment_id UUID REFERENCES enrollments(id) ON DELETE SET NULL,
    
    -- Dados do Asaas
    asaas_payment_id VARCHAR(100) UNIQUE NOT NULL,  -- ID do pagamento no Asaas
    asaas_customer_id VARCHAR(100),                 -- ID do cliente no Asaas
    
    -- Informações do pagamento
    billing_type payment_type NOT NULL DEFAULT 'UNDEFINED',
    status payment_status NOT NULL DEFAULT 'PENDING',
    value DECIMAL(10, 2) NOT NULL,
    net_value DECIMAL(10, 2),                       -- Valor líquido (após taxas)
    
    -- Parcelamento
    installment_count INTEGER DEFAULT 1,
    installment_number INTEGER DEFAULT 1,
    installment_value DECIMAL(10, 2),
    
    -- Datas
    due_date DATE NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE,
    confirmed_date TIMESTAMP WITH TIME ZONE,
    
    -- Descrição e referência
    description TEXT,
    external_reference VARCHAR(255),                -- Referência externa (user_id-turma_id)
    
    -- URLs (PIX e Boleto)
    invoice_url TEXT,                               -- URL da fatura
    bank_slip_url TEXT,                             -- URL do boleto
    pix_qr_code TEXT,                              -- QR Code PIX (base64)
    pix_copy_paste TEXT,                           -- Código PIX copia e cola
    
    -- Informações adicionais
    discount_value DECIMAL(10, 2) DEFAULT 0,
    interest_value DECIMAL(10, 2) DEFAULT 0,
    fine_value DECIMAL(10, 2) DEFAULT 0,
    
    -- Metadados
    metadata JSONB,                                 -- Dados extras do Asaas
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_turma_id ON payments(turma_id);
CREATE INDEX IF NOT EXISTS idx_payments_enrollment_id ON payments(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_payments_asaas_payment_id ON payments(asaas_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_billing_type ON payments(billing_type);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_due_date ON payments(due_date);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_payments_updated_at();

-- ============================================================================
-- RLS (Row Level Security)
-- ============================================================================

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver seus próprios pagamentos
CREATE POLICY "Users can view own payments"
    ON payments FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Admins podem ver todos os pagamentos
CREATE POLICY "Admins can view all payments"
    ON payments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Policy: Sistema pode inserir pagamentos (via service role)
CREATE POLICY "System can insert payments"
    ON payments FOR INSERT
    WITH CHECK (true);

-- Policy: Sistema pode atualizar pagamentos (via service role)
CREATE POLICY "System can update payments"
    ON payments FOR UPDATE
    USING (true);

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE payments IS 'Registra todos os pagamentos realizados via gateway Asaas';
COMMENT ON COLUMN payments.asaas_payment_id IS 'ID único do pagamento no Asaas';
COMMENT ON COLUMN payments.billing_type IS 'Tipo de pagamento: CREDIT_CARD, DEBIT_CARD, PIX, BOLETO';
COMMENT ON COLUMN payments.status IS 'Status atual do pagamento no Asaas';
COMMENT ON COLUMN payments.value IS 'Valor total do pagamento';
COMMENT ON COLUMN payments.net_value IS 'Valor líquido após taxas do gateway';
COMMENT ON COLUMN payments.external_reference IS 'Referência externa para rastreamento (ex: user_id-turma_id)';
