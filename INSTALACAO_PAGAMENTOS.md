# 📋 GUIA DE INSTALAÇÃO - Sistema de Pagamentos

## 🎯 O que foi criado:

### 1. **Tabelas SQL** (3 arquivos)
- `payments-table.sql` - Registra todos os pagamentos
- `webhook-logs-table.sql` - Registra webhooks recebidos
- `enrollments-payments-integration.sql` - Vincula enrollments com payments

### 2. **Edge Function**
- `asaas-webhook/` - Recebe webhooks do Asaas e processa automaticamente

### 3. **Helper Frontend**
- `paymentService.ts` - Funções para criar e gerenciar pagamentos

---

## 📦 PASSO 1: Criar as Tabelas no Supabase

### Opção A: Via SQL Editor no Dashboard

1. Acesse: https://supabase.com/dashboard/project/jvfjvzotrqhlfwzcnixj/editor
2. Clique em: **+ New query**
3. Cole e execute **UM POR VEZ** nesta ordem:

```sql
-- 1º Execute:
supabase/payments-table.sql

-- 2º Execute:
supabase/webhook-logs-table.sql

-- 3º Execute:
supabase/enrollments-payments-integration.sql
```

### Opção B: Via Terminal (se tiver Supabase CLI)

```bash
# 1. Criar as tabelas
psql -h db.jvfjvzotrqhlfwzcnixj.supabase.co -U postgres -d postgres -f supabase/payments-table.sql
psql -h db.jvfjvzotrqhlfwzcnixj.supabase.co -U postgres -d postgres -f supabase/webhook-logs-table.sql
psql -h db.jvfjvzotrqhlfwzcnixj.supabase.co -U postgres -d postgres -f supabase/enrollments-payments-integration.sql
```

---

## 🔌 PASSO 2: Deploy da Edge Function Webhook

### Via Supabase Dashboard:

1. Acesse: https://supabase.com/dashboard/project/jvfjvzotrqhlfwzcnixj/functions
2. Clique em: **+ Create new function**
3. **Name:** `asaas-webhook`
4. Cole o código de: `supabase/functions/asaas-webhook/index.ts`
5. Clique em: **Deploy**

### Via CLI (se instalado):

```bash
supabase functions deploy asaas-webhook --no-verify-jwt
```

---

## 🔐 PASSO 3: Configurar Webhook Token (Opcional mas Recomendado)

Para maior segurança, configure um token de validação:

```bash
# Gerar token aleatório
$TOKEN = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})

# Configurar no Supabase
supabase secrets set ASAAS_WEBHOOK_TOKEN=$TOKEN
```

**Guarde esse token!** Você vai usar no Asaas.

---

## 🎣 PASSO 4: Configurar Webhook no Asaas

### Sandbox:
1. Acesse: https://sandbox.asaas.com/config/webhooks
2. Clique em: **+ Adicionar webhook**
3. **URL:** `https://jvfjvzotrqhlfwzcnixj.supabase.co/functions/v1/asaas-webhook`
4. **Token de acesso:** (o token gerado no PASSO 3, se configurou)
5. **Eventos a serem notificados:** Marque todos relacionados a `PAYMENT`:
   - ✅ PAYMENT_CREATED
   - ✅ PAYMENT_UPDATED
   - ✅ PAYMENT_CONFIRMED ⭐ **IMPORTANTE**
   - ✅ PAYMENT_RECEIVED ⭐ **IMPORTANTE**
   - ✅ PAYMENT_OVERDUE
   - ✅ PAYMENT_REFUNDED
6. Clique em: **Salvar**

### Produção (quando for usar):
- Mesma coisa em: https://www.asaas.com.br/config/webhooks

---

## 🔄 PASSO 5: Atualizar o Código do Checkout

O arquivo `Checkout.tsx` precisa ser atualizado para registrar os pagamentos no banco.

### Importar o paymentService:

Adicione no início do arquivo `src/pages/Checkout.tsx`:

```typescript
import { createEnrollmentWithPayment } from '@/lib/paymentService';
```

### Atualizar cada método de pagamento:

Após criar o pagamento no Asaas, adicione:

```typescript
// Exemplo para cartão de crédito:
const payment = await asaasService.createCreditCardPayment({...});

// ✅ ADICIONAR ISSO:
await createEnrollmentWithPayment({
  userId: currentUser.id,
  turmaId: turma.id,
  modality: turmaModality,
  asaasPaymentId: payment.id,
  billingType: 'CREDIT_CARD',
  value: totalValue,
  dueDate: dueDate.toISOString().split('T')[0],
  description: `Matrícula - ${turma.name}`,
  externalReference: `${currentUser.id}-${turma.id}`,
  installmentCount: installmentCount
});
```

---

## ✅ PASSO 6: Testar o Sistema

### Teste 1: Criar Pagamento
1. Acesse uma turma no site
2. Clique em "Matricular-se"
3. Escolha um método de pagamento
4. Complete o checkout

### Teste 2: Verificar no Banco
```sql
-- Ver pagamentos criados
SELECT * FROM payments ORDER BY created_at DESC LIMIT 10;

-- Ver matrículas
SELECT * FROM enrollments ORDER BY created_at DESC LIMIT 10;
```

### Teste 3: Simular Webhook
No Asaas Sandbox, você pode forçar um webhook:
1. Vá em: https://sandbox.asaas.com/cobranca
2. Encontre o pagamento
3. Clique em "..." → "Confirmar pagamento"
4. O webhook será enviado automaticamente
5. A matrícula será aprovada automaticamente! 🎉

---

## 📊 ESTRUTURA DO SISTEMA

```
Frontend (Checkout)
    ↓
Asaas API (criar pagamento)
    ↓
Supabase (registrar payment + enrollment)
    ↓
Status: PENDING
    ↓
[Usuário paga]
    ↓
Asaas envia Webhook
    ↓
Edge Function (asaas-webhook)
    ↓
Atualiza payment.status = CONFIRMED
    ↓
Trigger automático ativa enrollment! ✅
    ↓
Aluno pode acessar o curso!
```

---

## 🔍 Verificar Logs

### Logs da Edge Function:
```bash
supabase functions logs asaas-webhook --tail
```

### Logs de Webhook no Banco:
```sql
SELECT * FROM webhook_logs ORDER BY created_at DESC LIMIT 20;
```

---

## 🐛 Troubleshooting

### Webhook não está chegando:
1. Verifique se a URL está correta no Asaas
2. Veja os logs: `supabase functions logs asaas-webhook`
3. Teste manualmente:
   ```bash
   curl -X POST https://jvfjvzotrqhlfwzcnixj.supabase.co/functions/v1/asaas-webhook \
     -H "Content-Type: application/json" \
     -d '{"event":"PAYMENT_CONFIRMED","payment":{"id":"test123"}}'
   ```

### Matrícula não é aprovada automaticamente:
1. Verifique se o trigger existe:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'trigger_auto_approve_enrollment';
   ```
2. Veja logs do webhook
3. Verifique se o status do payment está correto

### Erro ao criar pagamento:
1. Verifique se as tabelas foram criadas
2. Veja logs do console do navegador
3. Verifique permissões RLS

---

## 📚 Documentação das Tabelas

### `payments`
- Armazena todos os pagamentos
- Status sincronizado com Asaas via webhook
- Vinculado com enrollment

### `webhook_logs`
- Registra todos os webhooks recebidos
- Útil para debug e auditoria
- Mostra erros de processamento

### `enrollments`
- Matrícula do aluno
- `payment_status`: pending/paid
- `status`: pending/active (ativado automaticamente)

---

## 🎉 Pronto!

Agora você tem um sistema completo de pagamentos com:
- ✅ Registro de todos os pagamentos
- ✅ Webhook funcionando
- ✅ Liberação automática de matrículas
- ✅ Logs de auditoria
- ✅ Painel financeiro (pode criar depois)

**Qualquer dúvida, estou aqui!** 🚀
