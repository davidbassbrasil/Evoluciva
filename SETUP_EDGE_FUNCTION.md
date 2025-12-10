# Configuração da Edge Function para Asaas

Este projeto usa Supabase Edge Functions para processar pagamentos do Asaas de forma segura.

## Pré-requisitos

1. **Instalar Supabase CLI**:
   ```bash
   npm install -g supabase
   ```

2. **Login no Supabase**:
   ```bash
   supabase login
   ```

3. **Link com seu projeto**:
   ```bash
   supabase link --project-ref jvfjvzotrqhlfwzcnixj
   ```

## Deploy da Edge Function

### 1. Deploy da função

Execute no terminal:

```bash
supabase functions deploy process-payment
```

### 2. Configurar Secrets (IMPORTANTE!)

As credenciais do Asaas devem ser configuradas como secrets no Supabase:

```bash
# API Key do Asaas (Sandbox)
supabase secrets set ASAAS_API_KEY="$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6Ojg0ZTI1Y2JlLWFjMmEtNDAzNS1hOTAzLWRkZTM3MWVmOWRlMTo6JGFhY2hfZWYxNzNjNzQtYmM3Yy00N2FkLWJlNWEtODQ3YzFkMjIzODli"

# Ambiente (sandbox ou production)
supabase secrets set ASAAS_ENV="sandbox"
```

**Para Produção**, substitua por:
```bash
supabase secrets set ASAAS_API_KEY="sua_chave_de_producao"
supabase secrets set ASAAS_ENV="production"
```

### 3. Verificar secrets configurados

```bash
supabase secrets list
```

## Testando a Edge Function

### Teste local (opcional)

```bash
# Criar arquivo .env na raiz do projeto supabase/functions/
# supabase/functions/.env
ASAAS_API_KEY=$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6Ojg0ZTI1Y2JlLWFjMmEtNDAzNS1hOTAzLWRkZTM3MWVmOWRlMTo6JGFhY2hfZWYxNzNjNzQtYmM3Yy00N2FkLWJlNWEtODQ3YzFkMjIzODli
ASAAS_ENV=sandbox

# Servir localmente
supabase functions serve process-payment --env-file supabase/functions/.env
```

### Teste via curl

Após o deploy, você pode testar diretamente:

```bash
curl -i --location --request POST 'https://jvfjvzotrqhlfwzcnixj.supabase.co/functions/v1/process-payment' \
  --header 'Authorization: Bearer SEU_JWT_TOKEN' \
  --header 'Content-Type: application/json' \
  --data '{
    "method": "GET",
    "endpoint": "/customers?cpfCnpj=12345678909"
  }'
```

## Como funciona

1. **Frontend** (`asaasService.ts`):
   - Obtém o JWT do usuário autenticado
   - Chama a Edge Function enviando: `method`, `endpoint`, `body`
   - Exemplo: `{ method: 'POST', endpoint: '/customers', body: {...} }`

2. **Edge Function** (`process-payment/index.ts`):
   - Valida JWT do usuário (autenticação Supabase)
   - Faz a requisição para API do Asaas com a chave segura
   - Retorna a resposta para o frontend

3. **Segurança**:
   - ✅ API Key nunca exposta no frontend
   - ✅ Autenticação obrigatória via JWT
   - ✅ CORS configurado corretamente
   - ✅ Funciona em Sandbox e Produção

## URL da Edge Function

**Sandbox**: `https://jvfjvzotrqhlfwzcnixj.supabase.co/functions/v1/process-payment`

Esta URL já está configurada no `asaasService.ts`.

## Dados de Teste (Sandbox)

Use estes dados para testar pagamentos no ambiente sandbox:

- **CPF**: `12345678909`
- **Cartão**: `5162306219378829`
- **CVV**: `318`
- **Validade**: `12/2026`

## Monitoramento

Visualize logs da Edge Function no dashboard do Supabase:
https://supabase.com/dashboard/project/jvfjvzotrqhlfwzcnixj/functions

## Troubleshooting

### Erro 401 (Unauthorized)
- Verifique se o usuário está autenticado
- Verifique se o token JWT está sendo enviado corretamente

### Erro 500 (Internal Server Error)
- Verifique se os secrets estão configurados: `supabase secrets list`
- Verifique os logs da Edge Function no dashboard
- Teste localmente com `supabase functions serve`

### CORS Error
- A Edge Function já tem CORS configurado
- Se persistir, verifique se está usando HTTPS (não HTTP)
