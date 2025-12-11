# ⚠️ EXECUTE ESTE SQL ANTES DE CRIAR USUÁRIOS

## Passo a Passo:

### 1. Acesse o Supabase SQL Editor
- Vá em: https://supabase.com/dashboard/project/SEU_PROJECT/sql
- Ou no dashboard do Supabase > SQL Editor

### 2. Execute o arquivo `permissions-system.sql`

**Opção A - Copiar e Colar:**
1. Abra o arquivo `supabase/permissions-system.sql` deste projeto
2. Copie todo o conteúdo
3. Cole no SQL Editor do Supabase
4. Clique em **RUN** (ou F5)

**Opção B - Upload:**
1. No SQL Editor, clique em **New Query**
2. Cole o conteúdo do arquivo `permissions-system.sql`
3. Clique em **RUN**

### 3. O que este SQL faz:

✅ Adiciona o role `'moderator'` ao enum `user_role`  
✅ Cria a tabela `user_permissions` (para controlar permissões granulares)  
✅ Configura políticas RLS de segurança  
✅ Cria a função `has_permission()` para verificar permissões  

### 4. Após executar:

Você poderá:
- Criar novos usuários em `/admin/acesso`
- Definir se são **Administradores** ou **Moderadores**
- Configurar permissões específicas para moderadores

---

## ⚠️ Se não executar este SQL:

Você verá este erro ao criar usuários:
```
new row for relation "profiles" violates check constraint "profiles_role_check"
```

## 🎯 Depois de executar:

1. Vá em `/admin/acesso`
2. Clique em **Novo Usuário**
3. Crie um moderador para testar
4. Configure as permissões dele

---

**Arquivo SQL:** `supabase/permissions-system.sql`
