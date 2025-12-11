-- ============================================================================
-- TABELA DE WEBHOOK LOGS
-- Registra todos os webhooks recebidos do Asaas
-- ============================================================================

-- Dropar tabela se existir (limpeza completa)
DROP TABLE IF EXISTS webhook_logs CASCADE;

-- Dropar ENUM se existir (para re-criação limpa)
DROP TYPE IF EXISTS webhook_event_type CASCADE;

-- Criar ENUM para tipo de evento
CREATE TYPE webhook_event_type AS ENUM (
    'PAYMENT_CREATED',
    'PAYMENT_UPDATED',
    'PAYMENT_CONFIRMED',
    'PAYMENT_RECEIVED',
    'PAYMENT_OVERDUE',
    'PAYMENT_DELETED',
    'PAYMENT_REFUNDED',
    'PAYMENT_RECEIVED_IN_CASH',
    'PAYMENT_CHARGEBACK_REQUESTED',
    'PAYMENT_CHARGEBACK_DISPUTE',
    'PAYMENT_AWAITING_CHARGEBACK_REVERSAL',
    'PAYMENT_DUNNING_RECEIVED',
    'PAYMENT_DUNNING_REQUESTED',
    'PAYMENT_BANK_SLIP_VIEWED',
    'PAYMENT_CHECKOUT_VIEWED'
);

-- Criar tabela de webhook logs
CREATE TABLE webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Tipo e identificação
    event_type webhook_event_type NOT NULL,
    asaas_payment_id VARCHAR(100),
    payment_id UUID,  -- Será linkado depois com payments
    
    -- Dados do webhook
    payload JSONB NOT NULL,                         -- Payload completo do webhook
    
    -- Status de processamento
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    -- Headers do request
    headers JSONB,
    
    -- IP e origem
    source_ip INET,
    user_agent TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_type ON webhook_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_asaas_payment_id ON webhook_logs(asaas_payment_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_payment_id ON webhook_logs(payment_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_processed ON webhook_logs(processed);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at DESC);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_webhook_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER webhook_logs_updated_at
    BEFORE UPDATE ON webhook_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_webhook_logs_updated_at();

-- ============================================================================
-- RLS (Row Level Security)
-- ============================================================================

ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Apenas admins podem ver logs de webhook
CREATE POLICY "Admins can view webhook logs"
    ON webhook_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Policy: Sistema pode inserir logs (via service role)
CREATE POLICY "System can insert webhook logs"
    ON webhook_logs FOR INSERT
    WITH CHECK (true);

-- Policy: Sistema pode atualizar logs (via service role)
CREATE POLICY "System can update webhook logs"
    ON webhook_logs FOR UPDATE
    USING (true);

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE webhook_logs IS 'Registra todos os webhooks recebidos do gateway Asaas';
COMMENT ON COLUMN webhook_logs.event_type IS 'Tipo do evento recebido do webhook';
COMMENT ON COLUMN webhook_logs.payload IS 'Payload completo recebido do Asaas';
COMMENT ON COLUMN webhook_logs.processed IS 'Indica se o webhook foi processado com sucesso';
COMMENT ON COLUMN webhook_logs.retry_count IS 'Número de tentativas de processamento';

-- ============================================================================
-- ADICIONAR CONSTRAINT PARA PAYMENTS (executar DEPOIS de criar tabela payments)
-- ============================================================================
-- NOTA: Execute isso APENAS após criar a tabela payments!
-- 
-- ALTER TABLE webhook_logs 
--   ADD CONSTRAINT fk_webhook_logs_payment_id 
--   FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL;
