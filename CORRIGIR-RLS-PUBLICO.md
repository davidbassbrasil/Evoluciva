# Como corrigir as políticas RLS para conteúdo público

## Problema
As tabelas `banners`, `professors`, `tags`, `testimonials` e `faqs` não aparecem para usuários não-admin porque as políticas RLS estão bloqueando o acesso.

## Solução

### 1. Abra o Supabase Dashboard
- Vá para https://supabase.com/dashboard
- Selecione seu projeto

### 2. Execute o SQL
- No menu lateral, clique em **SQL Editor**
- Clique em **New Query**
- Cole o conteúdo do arquivo `fix-public-tables-policies.sql`
- Clique em **Run** ou pressione `Ctrl+Enter`

### 3. Verifique
Após executar, você verá uma tabela com todas as políticas criadas. Certifique-se de que cada tabela tem 4 políticas:
- `tablename_select_all`
- `tablename_insert_all`
- `tablename_update_all`
- `tablename_delete_all`

### 4. Teste
- Deslogue da conta admin
- Faça login com uma conta de aluno
- Acesse a página principal
- Todas as seções devem aparecer agora! ✅

## O que essas políticas fazem?

```sql
USING (true)        -- Permite leitura/modificação sem restrições
WITH CHECK (true)   -- Permite inserção/atualização sem restrições
```

Essas políticas são **permissivas** e adequadas para **conteúdo público** como:
- ✅ Banners da página inicial
- ✅ Lista de professores
- ✅ Tags/matérias disponíveis
- ✅ Depoimentos de alunos
- ✅ FAQs

**Importante para produção:** 
Em produção, você pode querer restringir INSERT/UPDATE/DELETE para apenas admins, mantendo SELECT público:

```sql
-- Apenas leitura pública
CREATE POLICY "table_select_public" ON table_name FOR SELECT USING (true);

-- Escrita apenas para admins
CREATE POLICY "table_insert_admin" ON table_name FOR INSERT 
  WITH CHECK (auth.jwt()->>'role' = 'admin');
```
