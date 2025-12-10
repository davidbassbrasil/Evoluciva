# Solução CORS - Backend Proxy Asaas

O problema de CORS acontece porque o navegador bloqueia chamadas diretas do frontend para a API do Asaas por segurança.

## Solução: Backend Proxy

### Passo 1: Instalar dependências do proxy

```bash
# Na pasta raiz do projeto
npm install express cors node-fetch@2
```

### Passo 2: Iniciar o proxy backend

Abra um **novo terminal** e execute:

```bash
node backend-proxy.js
```

Você verá:
```
✅ Proxy Asaas rodando em http://localhost:3001
```

### Passo 3: Iniciar o frontend

Em **outro terminal**, execute:

```bash
npm run dev
```

### Passo 4: Testar

Agora o checkout deve funcionar! O fluxo é:

```
Frontend (navegador) → Backend Proxy (Node.js) → API Asaas
```

## Dados de Teste (Sandbox)

- **CPF**: `12345678909` ou qualquer CPF válido
- **Cartão**: `5162306219378829`
- **CVV**: `318`
- **Validade**: Qualquer data futura (ex: `12/26`)

## Para Produção

Quando for para produção, você precisa:

1. Hospedar o backend proxy (Vercel, Railway, Render, etc)
2. Atualizar `VITE_ASAAS_PROXY_URL` com a URL de produção
3. Mudar `VITE_ASAAS_ENV=production`
4. Usar a chave de API de produção

## Alternativa: Supabase Edge Functions

Se preferir não ter um backend separado, use Supabase Edge Functions (já criado em `supabase/functions/process-payment`).
