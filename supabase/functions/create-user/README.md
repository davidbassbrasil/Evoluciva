# 🚀 Edge Function: Create User

Edge Function para criar usuários no Supabase Auth usando o Admin SDK, sem afetar a sessão atual do usuário logado.

## 📋 Funcionalidades

- ✅ Cria usuário no Supabase Auth (auth.users)
- ✅ Cria perfil completo na tabela `profiles`
- ✅ Não afeta a sessão do admin/usuário logado
- ✅ Auto-confirma email do usuário
- ✅ Validações de email e senha
- ✅ Rollback automático em caso de erro
- ✅ CORS habilitado
- ✅ Suporte para campos customizados (CPF, endereço, telefone, etc)

## 🔧 Configuração

### 1. Variáveis de Ambiente

Certifique-se de que as seguintes variáveis estão configuradas no Supabase:

**No Supabase Dashboard → Project Settings → Edge Functions:**

- `SUPABASE_URL` (automático)
- `SUPABASE_SERVICE_ROLE_KEY` (automático)
- `SUPABASE_ANON_KEY` (automático)

**No seu projeto (.env.local):**

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key-aqui
```

### 2. Deploy da Edge Function

#### Pré-requisitos

Instale a Supabase CLI:

```powershell
# Via Scoop (Windows)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Ou via NPM
npm install -g supabase
```

#### Comandos de Deploy

```powershell
# 1. Login no Supabase
supabase login

# 2. Link com seu projeto
supabase link --project-ref SEU_PROJECT_REF

# 3. Deploy da função create-user
supabase functions deploy create-user

# 4. Verificar status
supabase functions list
```

**Para encontrar seu PROJECT_REF:**
- Acesse: https://supabase.com/dashboard/project/SEU_PROJETO/settings/general
- Copie o "Reference ID"

### 3. Testar a Edge Function

Após o deploy, teste usando o Postman ou curl:

```powershell
# Teste de criação de usuário público (signup)
curl -X POST https://SEU_PROJECT.supabase.co/functions/v1/create-user `
  -H "Content-Type: application/json" `
  -d '{
    "email": "teste@example.com",
    "password": "senha123",
    "full_name": "Usuario Teste",
    "whatsapp": "(11) 98765-4321",
    "cpf": "123.456.789-00"
  }'

# Teste de criação por admin (requer auth token)
curl -X POST https://SEU_PROJECT.supabase.co/functions/v1/create-user `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer SEU_AUTH_TOKEN" `
  -d '{
    "email": "admin@example.com",
    "password": "senha123",
    "full_name": "Admin Teste",
    "role": "admin"
  }'
```

## 📖 Uso no Frontend

### Cadastro Público (Signup)

```typescript
import { signUpViaEdgeFunction } from '@/lib/createUserEdgeFunction';

const response = await signUpViaEdgeFunction(
  'João Silva',
  'joao@example.com',
  'senha123',
  {
    whatsapp: '(11) 98765-4321',
    cpf: '123.456.789-00',
    address: 'Rua Exemplo',
    number: '123',
    state: 'SP',
    city: 'São Paulo',
    cep: '01234-567'
  }
);

if (response.success) {
  console.log('Usuário criado:', response.user);
} else {
  console.error('Erro:', response.error);
}
```

### Cadastro Manual pelo Admin

```typescript
import { adminCreateUserViaEdgeFunction } from '@/lib/createUserEdgeFunction';

const response = await adminCreateUserViaEdgeFunction({
  email: 'aluno@example.com',
  password: 'senha123',
  full_name: 'Maria Santos',
  role: 'student',
  whatsapp: '(11) 98765-4321',
  cpf: '987.654.321-00',
  address: 'Av. Principal',
  number: '456',
  state: 'RJ',
  city: 'Rio de Janeiro',
  cep: '20000-000'
});

if (response.success) {
  console.log('Aluno criado:', response.user);
} else {
  console.error('Erro:', response.error);
}
```

## 🔍 Parâmetros da API

### Request Body

```typescript
{
  email: string;              // Obrigatório - Email do usuário
  password: string;           // Obrigatório - Senha (mín. 6 caracteres)
  full_name: string;          // Obrigatório - Nome completo
  role?: 'student' | 'moderator' | 'admin';  // Padrão: 'student'
  whatsapp?: string;          // Opcional - Telefone WhatsApp
  cpf?: string;               // Opcional - CPF
  address?: string;           // Opcional - Endereço
  number?: string;            // Opcional - Número
  complement?: string;        // Opcional - Complemento
  state?: string;             // Opcional - Estado (UF)
  city?: string;              // Opcional - Cidade
  cep?: string;               // Opcional - CEP
  requirePasswordChange?: boolean;  // Opcional - Enviar email de reset
}
```

### Response

```typescript
// Sucesso
{
  success: true,
  user: {
    id: string,
    email: string,
    full_name: string,
    role: string
  },
  message: "Usuário criado com sucesso"
}

// Erro
{
  success: false,
  error: string
}
```

## ⚠️ Tratamento de Erros

A Edge Function trata os seguintes erros:

- **400** - Campos obrigatórios faltando
- **400** - Email inválido
- **400** - Senha muito curta (< 6 caracteres)
- **409** - Email já cadastrado
- **500** - Erro interno do servidor
- **500** - Erro ao criar perfil (com rollback automático do Auth)

## 🛡️ Segurança

- ✅ Email auto-confirmado (sem necessidade de verificação)
- ✅ Usa SERVICE_ROLE_KEY (apenas no servidor)
- ✅ CORS configurado
- ✅ Validações no backend
- ✅ Rollback automático em caso de erro parcial
- ✅ Não expõe credenciais sensíveis

## 🔄 Atualizações e Redeploy

Para atualizar a função após modificações:

```powershell
# Edite o arquivo: supabase/functions/create-user/index.ts
# Então faça redeploy:
supabase functions deploy create-user
```

## 📊 Monitoramento

Visualize logs da função no dashboard:

```powershell
# Ver logs em tempo real
supabase functions serve create-user

# Ou no dashboard:
# https://supabase.com/dashboard/project/SEU_PROJETO/functions/create-user/logs
```

## 🐛 Troubleshooting

### Erro: "Missing SUPABASE_SERVICE_ROLE_KEY"

Verifique se as variáveis de ambiente estão configuradas:

```powershell
supabase secrets list
```

### Erro: "Email já cadastrado"

O email já existe no auth.users. Use outro email ou delete o usuário existente.

### Erro: "CORS"

Certifique-se de incluir os headers corretos na requisição:
- `Content-Type: application/json`
- `Authorization: Bearer TOKEN` (se aplicável)

### A função não aparece após deploy

Aguarde 1-2 minutos e limpe o cache do navegador. Verifique:

```powershell
supabase functions list
```

## 📝 Notas Importantes

1. **Sessão do Admin:** Esta função NÃO afeta a sessão do usuário logado (admin ou outro)
2. **Auto-confirmação:** Emails são auto-confirmados (email_confirm: true)
3. **Perfil Completo:** Cria usuário no Auth + registro completo na tabela `profiles`
4. **Rollback:** Se falhar ao criar o perfil, o usuário auth é deletado automaticamente

## 🔗 Arquivos Relacionados

- `/supabase/functions/create-user/index.ts` - Edge Function principal
- `/supabase/functions/create-user/deno.json` - Configuração Deno
- `/src/lib/createUserEdgeFunction.ts` - Helper TypeScript para frontend
- `/src/pages/aluno/Login.tsx` - Página de signup (usa a função)
- `/src/pages/admin/Alunos.tsx` - Admin criar alunos (usa a função)

## 📞 Suporte

Para mais informações sobre Edge Functions:
- [Documentação Supabase](https://supabase.com/docs/guides/functions)
- [Deploy Guide](https://supabase.com/docs/guides/functions/deploy)
- [CLI Reference](https://supabase.com/docs/reference/cli/supabase-functions-deploy)
