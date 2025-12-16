# 🧪 Exemplos de Uso - Edge Function create-user

Este arquivo contém exemplos práticos de como usar a Edge Function create-user.

## 📋 Índice

1. [Cadastro Público (Signup)](#cadastro-público-signup)
2. [Admin Criar Aluno](#admin-criar-aluno)
3. [Admin Criar Moderador](#admin-criar-moderador)
4. [PowerShell Examples](#powershell-examples)
5. [JavaScript/TypeScript Examples](#javascripttypescript-examples)
6. [Tratamento de Erros](#tratamento-de-erros)

---

## Cadastro Público (Signup)

### Frontend (TypeScript)

```typescript
import { signUpViaEdgeFunction } from '@/lib/createUserEdgeFunction';

async function handleSignup() {
  const response = await signUpViaEdgeFunction(
    'João Silva',
    'joao@example.com',
    'senha123',
    {
      whatsapp: '(11) 98765-4321',
      cpf: '123.456.789-00',
      address: 'Rua Exemplo',
      number: '123',
      complement: 'Apto 45',
      state: 'SP',
      city: 'São Paulo',
      cep: '01234-567'
    }
  );

  if (response.success) {
    console.log('✅ Usuário criado:', response.user);
    // Fazer login automático
    await signIn(email, password);
    navigate('/aluno/dashboard');
  } else {
    console.error('❌ Erro:', response.error);
    toast({
      title: 'Erro no cadastro',
      description: response.error,
      variant: 'destructive'
    });
  }
}
```

### PowerShell (cURL)

```powershell
$url = "https://SEU_PROJECT.supabase.co/functions/v1/create-user"

$body = @{
    email = "joao@example.com"
    password = "senha123"
    full_name = "João Silva"
    whatsapp = "(11) 98765-4321"
    cpf = "123.456.789-00"
    address = "Rua Exemplo"
    number = "123"
    state = "SP"
    city = "São Paulo"
    cep = "01234-567"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri $url -Method POST -Body $body -ContentType "application/json"

if ($response.success) {
    Write-Host "✅ Usuário criado: $($response.user.email)"
} else {
    Write-Host "❌ Erro: $($response.error)"
}
```

---

## Admin Criar Aluno

### Frontend (TypeScript)

```typescript
import { adminCreateUserViaEdgeFunction } from '@/lib/createUserEdgeFunction';

async function handleAdminCreateStudent() {
  // Precisa estar autenticado como admin
  const response = await adminCreateUserViaEdgeFunction({
    email: 'maria@example.com',
    password: 'senha123',
    full_name: 'Maria Santos',
    role: 'student',
    whatsapp: '(21) 98765-4321',
    cpf: '987.654.321-00',
    address: 'Av. Principal',
    number: '456',
    state: 'RJ',
    city: 'Rio de Janeiro',
    cep: '20000-000'
  });

  if (response.success) {
    console.log('✅ Aluno criado:', response.user);
    toast({
      title: 'Sucesso',
      description: 'Aluno cadastrado com sucesso!'
    });
    loadProfiles(); // Recarregar lista
  } else {
    console.error('❌ Erro:', response.error);
    toast({
      title: 'Erro',
      description: response.error,
      variant: 'destructive'
    });
  }
}
```

### PowerShell (com Auth Token)

```powershell
# 1. Obter token de autenticação do admin
$loginUrl = "https://SEU_PROJECT.supabase.co/auth/v1/token?grant_type=password"
$loginBody = @{
    email = "admin@example.com"
    password = "admin123"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri $loginUrl `
    -Method POST `
    -Body $loginBody `
    -ContentType "application/json" `
    -Headers @{ "apikey" = "SUA_ANON_KEY" }

$authToken = $loginResponse.access_token

# 2. Criar usuário com o token de admin
$url = "https://SEU_PROJECT.supabase.co/functions/v1/create-user"

$body = @{
    email = "maria@example.com"
    password = "senha123"
    full_name = "Maria Santos"
    role = "student"
    whatsapp = "(21) 98765-4321"
    cpf = "987.654.321-00"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri $url `
    -Method POST `
    -Body $body `
    -ContentType "application/json" `
    -Headers @{ 
        "Authorization" = "Bearer $authToken"
    }

Write-Host "✅ Aluno criado: $($response.user.email)"
```

---

## Admin Criar Moderador

### Frontend (TypeScript)

```typescript
import { adminCreateUserViaEdgeFunction } from '@/lib/createUserEdgeFunction';

async function handleAdminCreateModerator() {
  const response = await adminCreateUserViaEdgeFunction({
    email: 'moderador@example.com',
    password: 'senha123',
    full_name: 'Pedro Moderador',
    role: 'moderator',
    requirePasswordChange: true // Força trocar senha no primeiro login
  });

  if (response.success) {
    console.log('✅ Moderador criado:', response.user);
    // Um email de reset de senha será enviado automaticamente
  }
}
```

---

## PowerShell Examples

### Criar Usuário Simples

```powershell
$url = "https://SEU_PROJECT.supabase.co/functions/v1/create-user"

$body = @{
    email = "teste@example.com"
    password = "senha123"
    full_name = "Usuario Teste"
} | ConvertTo-Json

Invoke-RestMethod -Uri $url -Method POST -Body $body -ContentType "application/json"
```

### Criar Múltiplos Usuários (Batch)

```powershell
$url = "https://SEU_PROJECT.supabase.co/functions/v1/create-user"

$usuarios = @(
    @{ email = "aluno1@example.com"; password = "senha123"; full_name = "Aluno 1" },
    @{ email = "aluno2@example.com"; password = "senha123"; full_name = "Aluno 2" },
    @{ email = "aluno3@example.com"; password = "senha123"; full_name = "Aluno 3" }
)

foreach ($usuario in $usuarios) {
    $body = $usuario | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri $url -Method POST -Body $body -ContentType "application/json"
        Write-Host "✅ Criado: $($response.user.email)"
    } catch {
        Write-Host "❌ Erro ao criar: $($usuario.email)"
    }
    
    Start-Sleep -Milliseconds 500 # Delay para não sobrecarregar
}
```

### Importar de CSV

```powershell
# Arquivo CSV: alunos.csv
# email,password,full_name,whatsapp,cpf
# joao@example.com,senha123,João Silva,(11) 98765-4321,123.456.789-00
# maria@example.com,senha123,Maria Santos,(21) 98765-4321,987.654.321-00

$url = "https://SEU_PROJECT.supabase.co/functions/v1/create-user"
$csv = Import-Csv "alunos.csv"

foreach ($row in $csv) {
    $body = @{
        email = $row.email
        password = $row.password
        full_name = $row.full_name
        whatsapp = $row.whatsapp
        cpf = $row.cpf
        role = "student"
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri $url -Method POST -Body $body -ContentType "application/json"
        Write-Host "✅ Importado: $($row.email)"
    } catch {
        Write-Host "❌ Erro: $($row.email) - $($_.Exception.Message)"
    }
}
```

---

## JavaScript/TypeScript Examples

### Fetch API (Vanilla JS)

```javascript
async function createUser(userData) {
  const response = await fetch(
    'https://SEU_PROJECT.supabase.co/functions/v1/create-user',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    }
  );

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Erro ao criar usuário');
  }
  
  return data;
}

// Uso
try {
  const result = await createUser({
    email: 'teste@example.com',
    password: 'senha123',
    full_name: 'Usuario Teste'
  });
  
  console.log('✅ Usuário criado:', result.user);
} catch (error) {
  console.error('❌ Erro:', error.message);
}
```

### Axios

```javascript
import axios from 'axios';

async function createUser(userData) {
  try {
    const response = await axios.post(
      'https://SEU_PROJECT.supabase.co/functions/v1/create-user',
      userData,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.error);
    }
    throw error;
  }
}
```

---

## Tratamento de Erros

### Erros Comuns

```typescript
import { signUpViaEdgeFunction } from '@/lib/createUserEdgeFunction';

async function handleSignupWithErrorHandling() {
  try {
    const response = await signUpViaEdgeFunction(
      name,
      email,
      password,
      profileFields
    );

    if (!response.success) {
      // Tratar erros específicos
      switch (response.error) {
        case 'Este email já está cadastrado':
          toast({
            title: 'Email já cadastrado',
            description: 'Tente fazer login ou use outro email.',
            variant: 'destructive'
          });
          break;
          
        case 'Email inválido':
          toast({
            title: 'Email inválido',
            description: 'Verifique o formato do email.',
            variant: 'destructive'
          });
          break;
          
        case 'A senha deve ter no mínimo 6 caracteres':
          toast({
            title: 'Senha muito curta',
            description: 'Use no mínimo 6 caracteres.',
            variant: 'destructive'
          });
          break;
          
        default:
          toast({
            title: 'Erro no cadastro',
            description: response.error || 'Tente novamente.',
            variant: 'destructive'
          });
      }
      return;
    }

    // Sucesso
    toast({
      title: 'Cadastro realizado!',
      description: 'Bem-vindo à plataforma.'
    });
    
    // Login automático
    await signIn(email, password);
    navigate('/aluno/dashboard');
    
  } catch (error: any) {
    // Erro de rede ou exceção
    console.error('Exception:', error);
    toast({
      title: 'Erro de conexão',
      description: 'Verifique sua internet e tente novamente.',
      variant: 'destructive'
    });
  }
}
```

### Validações Antes de Enviar

```typescript
function validateUserData(data: CreateUserData): string | null {
  // Email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    return 'Email inválido';
  }
  
  // Senha
  if (data.password.length < 6) {
    return 'A senha deve ter no mínimo 6 caracteres';
  }
  
  // Nome
  if (!data.full_name || data.full_name.trim().length < 3) {
    return 'Nome deve ter no mínimo 3 caracteres';
  }
  
  // CPF (opcional mas se fornecido deve ser válido)
  if (data.cpf) {
    const cpfDigits = data.cpf.replace(/\D/g, '');
    if (cpfDigits.length !== 11) {
      return 'CPF inválido';
    }
  }
  
  // WhatsApp (opcional mas se fornecido deve ter 10-11 dígitos)
  if (data.whatsapp) {
    const phoneDigits = data.whatsapp.replace(/\D/g, '');
    if (phoneDigits.length < 10 || phoneDigits.length > 11) {
      return 'Telefone inválido';
    }
  }
  
  return null; // Válido
}

// Uso
const error = validateUserData(formData);
if (error) {
  toast({ title: 'Erro de validação', description: error, variant: 'destructive' });
  return;
}

// Prosseguir com criação
const response = await signUpViaEdgeFunction(...);
```

---

## 📝 Notas

- Todos os exemplos assumem que a Edge Function já foi deployada
- Substitua `SEU_PROJECT` pelo seu Project Reference ID
- Substitua `SUA_ANON_KEY` pela sua Supabase Anon Key
- Para testes locais, use `http://localhost:54321` ao invés da URL de produção
- Sempre valide dados no frontend antes de enviar para a Edge Function
- A Edge Function já faz validações, mas validar no frontend melhora a UX

---

## 🔗 Links Úteis

- [Documentação completa](./README.md)
- [Deploy guide](../../DEPLOY-EDGE-FUNCTION.md)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
