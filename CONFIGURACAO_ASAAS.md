# 🚀 Configuração Completa do Checkout Asaas

## 📋 Pré-requisitos

1. **Conta Asaas**: Criar conta em https://www.asaas.com/
2. **Supabase CLI**: Instalar para deploy da Edge Function
3. **API Key do Asaas**: Obter no painel da Asaas

---

## 🔑 Passo 1: Obter API Key da Asaas

### Ambiente Sandbox (Testes)
1. Acesse: https://sandbox.asaas.com/
2. Faça login na sua conta
3. Vá em **Configurações** → **Integrações** → **API Key**
4. Copie sua chave de **Sandbox**

### Ambiente Produção
1. Acesse: https://www.asaas.com/
2. Faça login na sua conta
3. Vá em **Configurações** → **Integrações** → **API Key**
4. Copie sua chave de **Produção**

---

## ⚙️ Passo 2: Configurar Variáveis de Ambiente no Supabase

### 2.1 - Via Dashboard (Recomendado)

1. Acesse seu projeto no Supabase: https://supabase.com/dashboard
2. Vá em **Project Settings** → **Edge Functions** → **Manage secrets**
3. Adicione as seguintes variáveis:

```
ASAAS_API_KEY = sua_chave_aqui
ASAAS_ENV = sandbox   (ou "production" quando for ao ar)
```

### 2.2 - Via Supabase CLI (Alternativo)

```bash
# Definir API Key
supabase secrets set ASAAS_API_KEY=sua_chave_aqui

# Definir ambiente (sandbox ou production)
supabase secrets set ASAAS_ENV=sandbox
```

---

## 🚀 Passo 3: Deploy da Edge Function

### 3.1 - Instalar Supabase CLI (se ainda não tiver)

```bash
npm install -g supabase
```

### 3.2 - Login no Supabase

```bash
supabase login
```

### 3.3 - Linkar o projeto

```bash
supabase link --project-ref SEU_PROJECT_REF
```

> **Dica**: Encontre o `project-ref` na URL do seu projeto Supabase

### 3.4 - Deploy da função

```bash
supabase functions deploy process-payment
```

### 3.5 - Verificar se funcionou

```bash
supabase functions list
```

Você deve ver `process-payment` na lista.

---

## 🧪 Passo 4: Testar a Integração

### 4.1 - Configurar variável de ambiente no frontend

Crie ou edite o arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_aqui
```

### 4.2 - Testar no navegador

1. Acesse `/checkout` no seu site
2. Faça login com um usuário válido
3. Tente criar um pagamento de teste

### 4.3 - Monitorar logs

```bash
# Ver logs da Edge Function em tempo real
supabase functions logs process-payment --follow
```

---

## 🔍 Passo 5: Verificar Problemas Comuns

### ❌ Erro: "Missing authorization header"
**Causa**: Usuário não está logado  
**Solução**: Certifique-se de fazer login antes de acessar o checkout

### ❌ Erro: "ASAAS_API_KEY não configurado"
**Causa**: Variável de ambiente não foi definida no Supabase  
**Solução**: Siga o Passo 2 novamente

### ❌ Erro: "Invalid or expired token"
**Causa**: Token JWT expirou ou é inválido  
**Solução**: Faça logout e login novamente

### ❌ Erro: 401 na chamada da Edge Function
**Causa**: Edge Function não foi deployada ou secrets não foram configurados  
**Solução**: Execute `supabase functions deploy process-payment` novamente

---

## 📊 Passo 6: Monitoramento e Testes

### Testar Cartão de Crédito (Sandbox)

Use os dados de teste da Asaas:

```
Número do Cartão: 5162306219378829
CVV: 318
Validade: 12/2025
Nome: JOHN DOE
```

### Testar PIX (Sandbox)

O QR Code gerado é simulado. Na sandbox, você pode:
- Simular pagamento confirmado via dashboard do Asaas
- Webhook será disparado automaticamente (se configurado)

### Testar Boleto (Sandbox)

O boleto gerado é simulado. Para confirmar:
- Acesse o painel da Asaas Sandbox
- Vá em "Cobranças" e marque como pago manualmente

---

## 🎯 Checklist de Configuração

- [ ] Conta Asaas criada
- [ ] API Key obtida (Sandbox ou Produção)
- [ ] Variáveis `ASAAS_API_KEY` e `ASAAS_ENV` configuradas no Supabase
- [ ] Edge Function `process-payment` deployada
- [ ] Arquivo `.env` configurado no frontend
- [ ] Teste de pagamento realizado com sucesso
- [ ] Logs da Edge Function verificados

---

## 🆘 Suporte

Se ainda tiver problemas:

1. **Verifique os logs**:
   ```bash
   supabase functions logs process-payment
   ```

2. **Console do navegador**: Abra DevTools (F12) e veja erros no Console

3. **Documentação Asaas**: https://docs.asaas.com/

4. **Status da API Asaas**: https://status.asaas.com/

---

## 🔄 Mudando de Sandbox para Produção

Quando estiver pronto para produção:

1. Obtenha a API Key de **Produção** no painel da Asaas
2. Atualize as variáveis no Supabase:
   ```bash
   supabase secrets set ASAAS_API_KEY=sua_chave_de_producao
   supabase secrets set ASAAS_ENV=production
   ```
3. Re-deploy a Edge Function:
   ```bash
   supabase functions deploy process-payment
   ```

---

**✅ Pronto!** Seu checkout Asaas está configurado e funcionando.
