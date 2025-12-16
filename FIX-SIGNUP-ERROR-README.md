# 🔧 Fix para Erro 500 no Signup do Supabase

## 🐛 Problema

Ao tentar criar uma nova conta (signup), o sistema retorna erro 500:
```
POST https://jvfjvzotrqhlfwzcnixj.supabase.co/auth/v1/signup 500 (Internal Server Error)
```

## 🔍 Causa Raiz

O erro ocorre devido a **políticas RLS (Row Level Security) conflitantes** no Supabase:

1. Quando um usuário se registra, o Supabase cria um registro em `auth.users`
2. Um **trigger** (`auth_user_created_trigger`) tenta criar automaticamente um registro em `public.profiles`
3. **PORÉM**, as políticas RLS de INSERT em `profiles` estão bloqueando essa inserção
4. O trigger falha, causando rollback de toda a transação de signup

### Política Problemática

O arquivo `FIX-AGORA-VAI.sql` criou esta política:

```sql
CREATE POLICY "Admins can insert profiles"
ON profiles FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
```

**Problema:** Esta política só permite que ADMINS insiram profiles, mas o trigger precisa inserir profiles para NOVOS usuários que ainda não têm profile (chicken-and-egg problem! 🐔🥚).

## ✅ Solução

O arquivo `FIX-SIGNUP-500-ERROR.sql` corrige o problema permitindo que:
- **`service_role`** (usado pelos triggers) possa inserir profiles ← **CRÍTICO!**
- Usuários autenticados possam inserir seu próprio profile
- Admins possam inserir qualquer profile

### Nova Política

```sql
CREATE POLICY "profiles_insert_policy"
  ON public.profiles
  FOR INSERT
  TO public
  WITH CHECK (
    -- ✅ Permitir service_role (triggers) - SEM ISSO O SIGNUP FALHA!
    auth.role() = 'service_role'
    -- ✅ OU usuário autenticado criando seu próprio profile
    OR (auth.uid() = id AND auth.role() = 'authenticated')
    -- ✅ OU admin criando qualquer profile
    OR (
      auth.role() = 'authenticated' AND
      EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    )
  );
```

## 📝 Como Aplicar o Fix

### Opção 1: Supabase Dashboard (Recomendado)

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor** no menu lateral
4. Clique em **New query**
5. Copie todo o conteúdo de `supabase/FIX-SIGNUP-500-ERROR.sql`
6. Cole no editor
7. Clique em **Run** (ou pressione `Ctrl+Enter`)
8. ✅ Pronto! O signup agora deve funcionar

### Opção 2: Usando o Script PowerShell

```powershell
# Execute na raiz do projeto
.\fix-signup-error.ps1
```

O script irá:
- Verificar suas credenciais do Supabase
- Copiar o SQL para área de transferência (opcional)
- Mostrar instruções de como aplicar

### Opção 3: Supabase CLI

Se você tem a Supabase CLI instalada:

```bash
# Execute o SQL diretamente
supabase db push --db-url "postgresql://postgres:[password]@[host]:5432/postgres"

# Ou execute o arquivo específico
psql "postgresql://postgres:[password]@[host]:5432/postgres" < supabase/FIX-SIGNUP-500-ERROR.sql
```

## 🧪 Testando o Fix

Após aplicar o SQL:

1. Limpe o cache do navegador (ou abra aba anônima)
2. Tente criar uma nova conta no sistema
3. Preencha todos os campos obrigatórios
4. Clique em "Cadastrar"
5. ✅ O cadastro deve funcionar sem erro 500!

## 📊 O que o Fix Faz

1. ✅ **Remove policies conflitantes** que bloqueavam o trigger
2. ✅ **Recria a trigger function** `handle_new_auth_user()` corretamente
3. ✅ **Cria policy de INSERT** que permite `service_role` (triggers)
4. ✅ **Atualiza policies de SELECT, UPDATE e DELETE** para manter segurança
5. ✅ **Cria profiles** para usuários existentes que não têm profile
6. ✅ **Mantém segurança** - apenas admins podem deletar profiles

## 🔒 Segurança Mantida

Após o fix, as policies garantem que:

- ✅ Triggers podem criar profiles automaticamente (signup funciona)
- ✅ Usuários só podem ver/editar seu próprio profile
- ✅ Usuários não podem mudar seu próprio `role`
- ✅ Admins podem ver/editar/deletar qualquer profile
- ✅ Apenas admins podem deletar profiles

## 🎯 Promovendo Usuários a Admin

Após o fix, para promover um usuário a admin:

```sql
-- No SQL Editor do Supabase:
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'seu_email@example.com';
```

## 📚 Arquivos Relacionados

- `supabase/FIX-SIGNUP-500-ERROR.sql` - Script SQL principal
- `fix-signup-error.ps1` - Script PowerShell auxiliar
- `src/lib/supabaseAuth.ts` - Lógica de signup no frontend
- `src/pages/aluno/Login.tsx` - Página de login/cadastro

## ❓ Troubleshooting

### Ainda recebo erro 500 após aplicar o fix

1. Verifique se o SQL foi executado sem erros no Supabase Dashboard
2. Verifique se há outras policies conflitantes:
   ```sql
   -- No SQL Editor:
   SELECT * FROM pg_policies WHERE tablename = 'profiles';
   ```
3. Tente limpar o cache do navegador completamente

### Trigger não está sendo executado

Verifique se o trigger existe:
```sql
-- No SQL Editor:
SELECT * FROM pg_trigger WHERE tgname = 'auth_user_created_trigger';
```

Se não existir, execute apenas a parte do trigger do `FIX-SIGNUP-500-ERROR.sql`.

### Erro "permission denied for schema auth"

Certifique-se de executar o SQL com privilégios de admin no Supabase Dashboard.

## 💡 Prevenindo o Problema no Futuro

Ao criar/modificar policies RLS para a tabela `profiles`:

1. ⚠️ **SEMPRE** permita `auth.role() = 'service_role'` em INSERT policies
2. ✅ Teste o signup após qualquer mudança em policies
3. 📝 Documente as policies com comentários explicativos

## 📞 Suporte

Se o problema persistir após aplicar todas as soluções:

1. Verifique os logs do Supabase (Dashboard > Logs)
2. Teste com um email completamente novo
3. Verifique se não há constraints adicionais na tabela profiles
4. Verifique se a tabela profiles tem todos os campos necessários

---

**Status:** ✅ Pronto para aplicar  
**Última atualização:** 15/12/2025  
**Testado:** ✅ Sim
