# ✅ CONFIGURAÇÃO ATUALIZADA: Edge Functions

## 🎯 Nova Solução Implementada

O site foi **migrado** para usar **Supabase Edge Functions** em vez do proxy Node.js. Esta é uma solução mais robusta, escalável e serverless.

## 📋 O que mudou

### ❌ Solução antiga (removida)
- Backend proxy Node.js (`backend-proxy.js`)
- Duas aplicações rodando (frontend + backend)
- Gerenciamento manual do servidor

### ✅ Solução nova (implementada)
- Supabase Edge Function (`process-payment`)
- Serverless (gerenciado pelo Supabase)
- Uma única aplicação (frontend)
- Autenticação integrada (JWT)

## 🚀 Setup Completo (3 passos)

### Passo 1: Instalar Supabase CLI

```bash
npm install -g supabase
```

### Passo 2: Login e Link do Projeto

```bash
# Login no Supabase
supabase login

# Link com seu projeto
supabase link --project-ref jvfjvzotrqhlfwzcnixj
```

### Passo 3: Deploy e Configuração

```bash
# Deploy da Edge Function
supabase functions deploy process-payment

# Configurar API Key do Asaas (IMPORTANTE!)
supabase secrets set ASAAS_API_KEY="$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6Ojg0ZTI1Y2JlLWFjMmEtNDAzNS1hOTAzLWRkZTM3MWVmOWRlMTo6JGFhY2hfZWYxNzNjNzQtYmM3Yy00N2FkLWJlNWEtODQ3YzFkMjIzODli"

# Configurar ambiente (sandbox)
supabase secrets set ASAAS_ENV="sandbox"

# Verificar se está configurado
supabase secrets list
```

## ✅ Pronto para testar

```bash
# Iniciar aplicação
npm run dev

# Acessar no navegador
http://localhost:5173
```

## 🧪 Dados de Teste (Sandbox)

- **CPF**: `12345678909`
- **Cartão**: `5162306219378829`
- **CVV**: `318`
- **Validade**: `12/2026`

## 📊 Monitoramento

Veja logs e status da Edge Function:
https://supabase.com/dashboard/project/jvfjvzotrqhlfwzcnixj/functions

## 🔄 Para Produção

Quando for lançar em produção:

```bash
# Atualizar para chave de produção
supabase secrets set ASAAS_API_KEY="sua_chave_de_producao"
supabase secrets set ASAAS_ENV="production"
```

## 📚 Documentação Detalhada

Para mais informações, veja: `SETUP_EDGE_FUNCTION.md`

## ❓ Troubleshooting

### Erro 401 (Unauthorized)
- Verifique se está logado no site (usuário autenticado)
- A Edge Function requer JWT válido

### Erro 500 (Internal Server Error)
- Verifique se os secrets foram configurados: `supabase secrets list`
- Verifique logs no dashboard do Supabase

### Edge Function não encontrada
- Faça o deploy: `supabase functions deploy process-payment`
- Verifique no dashboard se a função aparece

## 🎉 Benefícios

- ✅ **Serverless**: Sem servidor para gerenciar
- ✅ **Escalável**: Supabase cuida da infraestrutura
- ✅ **Seguro**: API Key nunca exposta
- ✅ **Simples**: Um comando para deploy
- ✅ **Integrado**: Usa autenticação do Supabase

---

**Status atual**: ✅ Código configurado, aguardando deploy da Edge Function
