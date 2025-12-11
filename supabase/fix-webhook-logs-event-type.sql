-- ============================================================================
-- FIX: Alterar event_type de ENUM para TEXT
-- Permite receber qualquer tipo de evento do Asaas sem restrições
-- ============================================================================

-- Alterar coluna event_type para TEXT (permite qualquer valor)
ALTER TABLE webhook_logs 
  ALTER COLUMN event_type TYPE TEXT;

-- Remover constraint NOT NULL temporariamente se houver problema
-- e adicionar novamente
ALTER TABLE webhook_logs 
  ALTER COLUMN event_type SET NOT NULL;

-- Criar índice para melhorar performance de busca
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_type_text ON webhook_logs(event_type);

-- Comentário
COMMENT ON COLUMN webhook_logs.event_type IS 'Tipo do evento recebido do webhook (agora aceita qualquer string)';

-- Nota: O ENUM webhook_event_type pode ser dropado se não for usado em outro lugar
-- DROP TYPE IF EXISTS webhook_event_type CASCADE;
