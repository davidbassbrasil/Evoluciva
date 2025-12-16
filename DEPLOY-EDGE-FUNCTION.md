# 🎯 Deploy da Edge Function create-user

## Comandos Rápidos

```powershell
# 1. Login no Supabase
supabase login

# 2. Link com o projeto (substitua SEU_PROJECT_REF)
supabase link --project-ref SEU_PROJECT_REF

# 3. Deploy da função
supabase functions deploy create-user

# 4. Verificar
supabase functions list
```

## Encontrar seu PROJECT_REF

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** → **General**
4. Copie o **Reference ID**

## Testar

```powershell
# Criar usuário de teste
curl -X POST https://SEU_PROJECT.supabase.co/functions/v1/create-user `
  -H "Content-Type: application/json" `
  -d '{
    "email": "teste@example.com",
    "password": "senha123",
    "full_name": "Usuario Teste"
  }'
```

## Ver Logs

```powershell
# Logs em tempo real
supabase functions serve create-user

# Ou acesse no dashboard:
# https://supabase.com/dashboard/project/SEU_PROJETO/functions
```

## Documentação Completa

Ver: `/supabase/functions/create-user/README.md`
