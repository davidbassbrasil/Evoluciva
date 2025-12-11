# 🔧 TROUBLESHOOTING - Webhook Logs não está preenchendo

## Problema
Pagamentos funcionam no Asaas mas a tabela `webhook_logs` não é preenchida.

## Checklist de Verificação

### 1️⃣ Verificar se a Edge Function está deployada
```bash
# No terminal, dentro da pasta do projeto
supabase functions deploy asaas-webhook
```

### 2️⃣ Executar o SQL fix para aceitar qualquer tipo de evento
Execute no Supabase SQL Editor o arquivo:
```
supabase/fix-webhook-logs-event-type.sql
```

Isso altera o campo `event_type` de ENUM para TEXT, permitindo receber qualquer evento do Asaas.

### 3️⃣ Configurar webhook no Asaas

**URL do Webhook:**
```
https://SEU_PROJECT_ID.supabase.co/functions/v1/asaas-webhook
```

**Como configurar:**
1. Acesse o painel do Asaas
2. Vá em Configurações > Webhooks
3. Adicione a URL acima
4. Selecione os eventos que deseja receber (recomendado: todos os de pagamento)
5. Teste a conexão

### 4️⃣ Verificar logs da Edge Function

No Supabase Dashboard:
1. Vá em **Edge Functions** > `asaas-webhook` > **Logs**
2. Faça um pagamento de teste
3. Verifique se o webhook foi recebido
4. Se houver erros, verifique a mensagem

### 5️⃣ Testar manualmente a Edge Function

Você pode testar com curl:
```bash
curl -X POST https://SEU_PROJECT_ID.supabase.co/functions/v1/asaas-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "PAYMENT_CREATED",
    "payment": {
      "id": "test_123",
      "customer": "cus_test",
      "billingType": "CREDIT_CARD",
      "value": 100,
      "status": "CONFIRMED",
      "dueDate": "2025-12-15"
    }
  }'
```

### 6️⃣ Verificar políticas RLS da tabela webhook_logs

Execute no SQL Editor:
```sql
-- Ver as policies da tabela
SELECT * FROM pg_policies WHERE tablename = 'webhook_logs';

-- Testar inserção direta (como admin)
INSERT INTO webhook_logs (event_type, asaas_payment_id, payload, source_ip)
VALUES ('TEST_EVENT', 'test_123', '{"test": true}'::jsonb, '127.0.0.1');

-- Se funcionar, o problema é na Edge Function
-- Se não funcionar, o problema é nas policies
```

### 7️⃣ Verificar variáveis de ambiente da Edge Function

No Supabase Dashboard:
1. Vá em **Project Settings** > **Edge Functions**
2. Verifique se as variáveis estão configuradas:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

## Solução mais provável

O problema mais comum é o **tipo de evento não estar no ENUM**. Execute o SQL fix:
```sql
ALTER TABLE webhook_logs ALTER COLUMN event_type TYPE TEXT;
```

Depois, re-deploy da edge function:
```bash
supabase functions deploy asaas-webhook
```

E configure o webhook no painel do Asaas.

## Verificar se está funcionando

1. Faça um pagamento de teste
2. Vá em Admin > Financeiro > aba "Logs Webhook"
3. Clique em "Atualizar"
4. O webhook deve aparecer na tabela

## Logs úteis para debug

Os logs da edge function mostrarão:
- `📩 Webhook recebido:` - Evento recebido
- `📦 Payload completo:` - Dados completos
- `💾 Tentando inserir log:` - Dados que serão inseridos
- `✅ Log salvo com ID:` - Sucesso
- `❌ Erro ao salvar log:` - Erro (mostra detalhes)
