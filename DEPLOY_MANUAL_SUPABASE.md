# 🌐 DEPLOY MANUAL - Edge Function pelo Dashboard

## Passo 1: Acessar o Dashboard do Supabase

1. Abra: https://supabase.com/dashboard/project/jvfjvzotrqhlfwzcnixj
2. Faça login se necessário

## Passo 2: Ir para Edge Functions

1. No menu lateral esquerdo, clique em: **Edge Functions**
2. Clique no botão: **+ Create new function**

## Passo 3: Criar a Função

1. **Function name:** `process-payment`
2. Deixe a opção **Import from GitHub** desmarcada
3. Clique em: **Create function**

## Passo 4: Copiar o Código

Abra o arquivo: `supabase/functions/process-payment/index.ts`

E cole TODO o conteúdo na área de código do dashboard.

## Passo 5: Configurar Secrets

1. No menu lateral, vá em: **Project Settings** (ícone de engrenagem)
2. Clique em: **Edge Functions**
3. Na seção **Secrets**, clique em: **+ Add secret**
4. Adicione:
   - **Name:** `ASAAS_API_KEY`
   - **Value:** `$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6Ojg0ZTI1Y2JlLWFjMmEtNDAzNS1hOTAzLWRkZTM3MWVmOWRlMTo6JGFhY2hfZWYxNzNjNzQtYmM3Yy00N2FkLWJlNWEtODQ3YzFkMjIzODli`
   
5. Clique em **+ Add secret** novamente:
   - **Name:** `ASAAS_ENV`
   - **Value:** `sandbox`

## Passo 6: Deploy

1. Volte para **Edge Functions** no menu lateral
2. Selecione a função `process-payment`
3. Clique em: **Deploy**

## ✅ Pronto!

Agora teste o checkout novamente no seu site.

---

## 🔄 Alternativa: Deploy via VS Code

Se preferir, posso criar um arquivo que você pode fazer upload direto:

1. Vou criar um arquivo `deploy-manual.md` com todos os passos
2. Você copia o código do `index.ts`
3. Cola no dashboard
4. Faz deploy

---

## 📝 Código Completo para Copiar

Copie todo o conteúdo de: `supabase/functions/process-payment/index.ts`

Ou eu posso mostrar aqui para você copiar facilmente.
