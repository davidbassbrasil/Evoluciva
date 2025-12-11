# 🚀 Checklist Rápido - Asaas Checkout

Use este guia rápido para verificar se tudo está configurado corretamente.

## ✅ 1. Verificar Variáveis de Ambiente

### Frontend (.env ou .env.local)
```bash
# Deve ter APENAS estas variáveis:
VITE_SUPABASE_URL=https://jvfjvzotrqhlfwzcnixj.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_aqui
```

⚠️ **NÃO coloque chaves da Asaas aqui!** Elas vão no Supabase.

### Backend (Supabase Secrets)
No Supabase Dashboard → Project Settings → Edge Functions → Manage secrets:

```bash
ASAAS_API_KEY=sua_chave_asaas_aqui
ASAAS_ENV=sandbox
```

## ✅ 2. Deploy da Edge Function

Abra o terminal na raiz do projeto e execute:

```bash
# Login no Supabase (se ainda não fez)
supabase login

# Link com seu projeto
supabase link --project-ref jvfjvzotrqhlfwzcnixj

# Deploy da função
supabase functions deploy process-payment --no-verify-jwt
```

## ✅ 3. Testar a Integração

### Opção A: Teste via Console do Navegador

1. Acesse seu site
2. Faça login como aluno
3. Abra o Console do navegador (F12)
4. Cole e execute:

```javascript
// Importar e rodar testes
import { runAllTests } from './src/lib/asaasTestUtils';
await runAllTests();
```

### Opção B: Teste Manual no Checkout

1. Acesse uma turma qualquer
2. Clique em "Matricular-se"
3. Preencha os dados de teste:
   - **CPF:** 12345678901
   - **Cartão:** 5162306219378829
   - **Validade:** 05/25
   - **CVV:** 318
   - **Nome:** JOHN DOE
4. Tente finalizar a compra

## 🔍 Possíveis Problemas e Soluções

### Erro: "Configuração Pendente"
**Causa:** Edge Function não encontrada ou variáveis não configuradas

**Solução:**
```bash
# 1. Verificar se a função foi deployada
supabase functions list

# 2. Ver logs da função
supabase functions logs process-payment

# 3. Verificar secrets
supabase secrets list
```

### Erro: "Network Error" ou "Failed to fetch"
**Causa:** URL da Edge Function incorreta

**Solução:**
1. Verifique se `VITE_SUPABASE_URL` no `.env` está correta
2. Deve ser: `https://jvfjvzotrqhlfwzcnixj.supabase.co`

### Erro: "Unauthorized" ou "Invalid API Key"
**Causa:** Chave da Asaas inválida ou não configurada

**Solução:**
1. Acesse https://sandbox.asaas.com/
2. Vá em: Integrações → API Key
3. Copie a chave e configure no Supabase:
   ```bash
   supabase secrets set ASAAS_API_KEY=sua_chave_aqui
   ```
4. Redeploy da função:
   ```bash
   supabase functions deploy process-payment --no-verify-jwt
   ```

### Erro: "Customer not found"
**Causa:** Primeira criação de cliente falhando

**Solução:**
1. Verifique se o CPF está no formato correto (apenas números)
2. Tente novamente com outro email

## 📊 Ver Logs em Tempo Real

```bash
# Logs da Edge Function
supabase functions logs process-payment --tail

# Ver todas as requisições
supabase functions logs process-payment --tail --debug
```

## 🎯 Próximos Passos

Depois que o checkout estiver funcionando no **sandbox**:

1. Crie uma conta em: https://www.asaas.com.br/
2. Obtenha a API Key de produção
3. Configure no Supabase:
   ```bash
   supabase secrets set ASAAS_API_KEY=nova_chave_producao
   supabase secrets set ASAAS_ENV=production
   ```
4. Redeploy:
   ```bash
   supabase functions deploy process-payment --no-verify-jwt
   ```

## 📚 Documentação Completa

Para mais detalhes, consulte: [CONFIGURACAO_ASAAS.md](./CONFIGURACAO_ASAAS.md)

## 🆘 Suporte

Se mesmo após seguir todos os passos o checkout não funcionar:

1. Copie os logs da Edge Function:
   ```bash
   supabase functions logs process-payment --limit 50 > logs.txt
   ```
2. Copie o erro que aparece no console do navegador (F12)
3. Verifique se todas as secrets estão configuradas:
   ```bash
   supabase secrets list
   ```
