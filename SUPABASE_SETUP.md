# Guia de Configuração do Supabase

## 🚀 Setup Rápido

### 1. Instale as dependências
```powershell
npm install
```

### 2. Configure as variáveis de ambiente
O arquivo `.env.local` já está configurado com suas credenciais:
- ✅ VITE_SUPABASE_URL
- ✅ VITE_SUPABASE_ANON_KEY

### 3. Execute o SQL no Supabase

**🚨 IMPORTANTE: Use o script corrigido para evitar erro 500**

Abra o Supabase Studio e execute o SQL:

**Opção 1 - Script completo (recomendado):**
```
Arquivo: supabase/quick-fix.sql
```
Este script limpa tudo e recria corretamente, evitando dependências circulares.

**Opção 2 - Script original:**
```
Arquivo: supabase/profiles_and_policies.sql
```
Use apenas se for primeira instalação.

**Passos:**
1. Vá em: https://supabase.com/dashboard/project/jvfjvzotrqhlfwzcnixj/sql/new
2. Cole todo o conteúdo de `supabase/quick-fix.sql`
3. Clique em **Run** (ou Ctrl/Cmd + Enter)
4. Verifique se retornou "Success. No rows returned"

Este script irá:
- ✅ Criar a tabela `public.profiles`
- ✅ Configurar triggers automáticos (updated_at, criação de perfil)
- ✅ Habilitar Row Level Security (RLS)
- ✅ Criar políticas de acesso (admin pode tudo, aluno vê só seus dados)

### 4. Inicie o servidor de desenvolvimento
```powershell
npm run dev
```

## 📋 Testando a Integração

### Cadastro de Aluno
1. Acesse `/aluno/login`
2. Clique em "Cadastre-se"
3. Preencha todos os campos obrigatórios
4. O sistema irá:
   - Criar usuário no Supabase Auth
   - Criar perfil completo em `public.profiles`
   - Fazer login automaticamente

### Login Admin
1. Primeiro, crie um usuário qualquer via cadastro
2. No Supabase SQL Editor, execute:
   ```sql
   UPDATE public.profiles 
   SET role = 'admin' 
   WHERE email = 'seu_email@example.com';
   ```
3. Acesse `/admin/login`
4. Faça login com as credenciais do usuário promovido

### Verificar Alunos no Admin
1. Login como admin
2. Acesse "Alunos" no menu lateral
3. Você verá todos os alunos cadastrados vindos do Supabase

## 🔐 Segurança (RLS)

As políticas configuradas garantem:

- **Estudantes:**
  - Podem ver apenas seu próprio perfil
  - Podem atualizar seus dados (exceto `role`)
  - Não podem mudar de estudante para admin

- **Admins:**
  - Podem ver todos os perfis
  - Podem criar, editar e deletar qualquer perfil
  - Podem promover usuários a admin

## 🛠️ Estrutura do Banco

### Tabela: `public.profiles`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | uuid | ID do usuário (FK para auth.users) |
| `email` | text | Email do usuário |
| `full_name` | text | Nome completo |
| `whatsapp` | text | WhatsApp com máscara |
| `cpf` | text | CPF com máscara |
| `address` | text | Endereço (rua/av) |
| `number` | text | Número |
| `complement` | text | Complemento |
| `state` | text | UF (2 letras) |
| `city` | text | Cidade |
| `cep` | text | CEP com máscara |
| `avatar` | text | URL da foto |
| `role` | text | 'student' ou 'admin' |
| `purchased_courses` | jsonb | Array de IDs de cursos |
| `progress` | jsonb | Progresso das aulas |
| `created_at` | timestamptz | Data de criação |
| `updated_at` | timestamptz | Última atualização |

## 🐛 Troubleshooting

### Erro 500: "Failed to load resource: the server responded with a status of 500"

**Causa:** A tabela `profiles` ainda não foi criada no Supabase ou as policies têm dependências circulares.

**Solução:**
1. Abra o Supabase SQL Editor
2. Execute o arquivo **atualizado** `supabase/profiles_and_policies.sql` (versão corrigida sem dependências circulares)
3. Verifique se a tabela foi criada:
   ```sql
   SELECT * FROM public.profiles LIMIT 1;
   ```
4. Recarregue a página do aplicativo

**Se o erro persistir:**
```sql
-- Limpe tudo e reaplique o SQL:
DROP TABLE IF EXISTS public.profiles CASCADE;
-- Então execute novamente supabase/profiles_and_policies.sql
```

### Erro: "Could not upsert profile after signUp"
- Verifique se o SQL foi executado corretamente
- Confirme que RLS está habilitado
- Verifique se as policies existem: `SELECT * FROM pg_policies WHERE tablename = 'profiles';`

### Alunos não aparecem no Admin
- Verifique se você está logado como admin (role='admin' no profiles)
- Abra o console do navegador e veja se há erros de permissão
- Confirme que a policy `profiles_select_admins_or_own` existe

### Login admin não funciona
- Certifique-se de ter promovido o usuário com UPDATE role='admin'
- Limpe o localStorage e tente novamente
- Verifique no Supabase Table Editor se o role está correto

## 📚 Documentação Adicional

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
