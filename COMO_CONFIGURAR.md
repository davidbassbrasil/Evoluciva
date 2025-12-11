# 🚀 COMO FAZER O CHECKOUT FUNCIONAR - PASSO A PASSO

Siga estes passos na ordem para configurar o checkout da Asaas:

## 📋 Pré-requisitos

1. **Supabase CLI instalado**
   ```bash
   npm install -g supabase
   ```

2. **Chave da API Asaas**
   - Já está configurada (encontrei no seu .env.local)
   - Chave Sandbox: `$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY...`

3. **Edge Function pronta**
   - ✅ Já existe em: `supabase/functions/process-payment/`
   - ✅ Arquivo `index.ts` completo
   - ✅ Arquivo `deno.json` configurado
   - **Você NÃO precisa modificar nada!** Só fazer o deploy.

## 🎯 Opção 1: Configuração Automática (RECOMENDADO)

Execute o script PowerShell que criei:

```powershell
# Clique com botão direito em:
configurar-asaas.ps1

# E escolha: "Executar com PowerShell"
```

**OU** execute no terminal:
```powershell
.\configurar-asaas.ps1
```

O script vai:
1. ✓ Fazer login no Supabase
2. ✓ Linkar com seu projeto
3. ✓ Configurar as secrets (ASAAS_API_KEY e ASAAS_ENV)
4. ✓ Fazer deploy da Edge Function

## 🔧 Opção 2: Configuração Manual

Se preferir fazer manualmente, execute estes comandos:

```bash
# 1. Login no Supabase
supabase login

# 2. Linkar projeto
supabase link --project-ref jvfjvzotrqhlfwzcnixj

# 3. Configurar secret da Asaas
supabase secrets set ASAAS_API_KEY=$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6Ojg0ZTI1Y2JlLWFjMmEtNDAzNS1hOTAzLWRkZTM3MWVmOWRlMTo6JGFhY2hfZWYxNzNjNzQtYmM3Yy00N2FkLWJlNWEtODQ3YzFkMjIzODli

# 4. Configurar ambiente (sandbox)
supabase secrets set ASAAS_ENV=sandbox

# 5. Deploy da Edge Function
supabase functions deploy process-payment --no-verify-jwt
```

## ✅ Verificar se Funcionou

1. **Reinicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

2. **Teste o checkout:**
   - Acesse qualquer turma no site
   - Clique em "Matricular-se"
   - Preencha com dados de teste:
     - **CPF:** 12345678901
     - **Cartão:** 5162306219378829
     - **Validade:** 05/25
     - **CVV:** 318
     - **Nome:** JOHN DOE

3. **Tente finalizar a compra**

## 🐛 Se der Erro

### Ver logs em tempo real:
```bash
supabase functions logs process-payment --tail
```

### Verificar se secrets estão configuradas:
```bash
supabase secrets list
```

Você deve ver:
```
ASAAS_API_KEY
ASAAS_ENV
```

### Verificar se a função foi deployada:
```bash
supabase functions list
```

Você deve ver:
```
process-payment
```

## 📚 Mais Informações

- **Guia rápido:** [VERIFICAR_ASAAS.md](./VERIFICAR_ASAAS.md)
- **Guia completo:** [CONFIGURACAO_ASAAS.md](./CONFIGURACAO_ASAAS.md)
- **Teste via código:** [src/lib/asaasTestUtils.ts](./src/lib/asaasTestUtils.ts)

## 🎉 Está Tudo Pronto!

Arquivos criados para você:

1. ✅ **CONFIGURACAO_ASAAS.md** - Guia completo detalhado
2. ✅ **VERIFICAR_ASAAS.md** - Checklist rápido
3. ✅ **configurar-asaas.ps1** - Script automático PowerShell
4. ✅ **configurar-asaas.bat** - Script automático CMD
5. ✅ **src/lib/asaasTestUtils.ts** - Testes programáticos
6. ✅ **.env.local** - Atualizado (sem chaves da Asaas)
7. ✅ **.env.example** - Atualizado com instruções

## 🚨 IMPORTANTE

- ⚠️ As chaves da Asaas NUNCA devem ficar no `.env.local`
- ✅ Elas devem estar nas **Secrets do Supabase**
- ✅ O `.env.local` deve ter APENAS: `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`

## 💡 Dica

Depois que estiver funcionando no sandbox, para ir para produção:

```bash
# 1. Obter chave de produção em: https://www.asaas.com.br/
# 2. Configurar:
supabase secrets set ASAAS_API_KEY=sua_chave_de_producao
supabase secrets set ASAAS_ENV=production

# 3. Redeploy:
supabase functions deploy process-payment --no-verify-jwt
```

---

**Qualquer dúvida, me chame! 🚀**
