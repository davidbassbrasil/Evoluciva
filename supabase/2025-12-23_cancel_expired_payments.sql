-- 2025-12-23_cancel_expired_payments.sql
-- Cria função para cancelar pagamentos pendentes expirados.
-- PIX: 30 minutos | BOLETO: 48 horas
-- Após adicionar este arquivo execute no Supabase SQL Editor ou via psql.

BEGIN;

-- Função que cancela pagamentos pendentes segundo regras por tipo
CREATE OR REPLACE FUNCTION public.cancel_expired_payments()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  -- Cancelar PIX pendentes com mais de 30 minutos
  UPDATE public.payments
  SET status = 'cancelled', updated_at = now()
  WHERE status = 'pending'
    AND billing_type = 'PIX'
    AND created_at < now() - INTERVAL '30 minutes';

  -- Cancelar BOLETO pendentes com mais de 48 horas
  UPDATE public.payments
  SET status = 'cancelled', updated_at = now()
  WHERE status = 'pending'
    AND billing_type = 'BOLETO'
    AND created_at < now() - INTERVAL '48 hours';

  -- (Opcional) registrar em log table se desejar auditar mudanças
  -- INSERT INTO public.payment_status_changes (payment_id, old_status, new_status, changed_at)
  -- SELECT id, 'pending', 'cancelled', now() FROM public.payments WHERE ...;
END;
$$;

COMMIT;

-- AGENDAMENTO (opcional): se sua instância do Postgres/Supabase tiver a extension pg_cron,
-- você pode agendar a execução periódica (ex.: a cada 5 minutos) com a query abaixo.
-- ATENÇÃO: execute manualmente no SQL Editor só se tiver a extensão pg_cron habilitada.
--
-- SELECT cron.schedule(
--   'cancel_expired_payments_job',         -- job name
--   '*/5 * * * *',                         -- cron expression: a cada 5 minutos
--   $$SELECT public.cancel_expired_payments();$$
-- );
--
-- Alternativa sem pg_cron: crie uma Edge Function ou um pequeno script que execute
-- a query `SELECT public.cancel_expired_payments();` e agende-o externamente (GitHub Actions, server cron, etc.).

-- USO/TESTE RÁPIDO:
-- 1) Rode: SELECT public.cancel_expired_payments();
-- 2) Verifique: SELECT id, status, billing_type, created_at FROM public.payments WHERE status = 'cancelled' ORDER BY updated_at DESC LIMIT 50;

-- Nota: ajuste nomes das colunas/tabela caso a sua tabela payments use outro esquema/coluna.
