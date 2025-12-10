# Correção Rápida - Policies do Supabase

## 🚨 Problema
As policies estão impedindo a criação de cursos porque requerem autenticação via JWT, mas o sistema está usando anon key.

## ✅ Solução

### Passo 1: Aplicar correção de policies

1. Acesse o **SQL Editor** no dashboard do Supabase
2. Copie o conteúdo do arquivo `supabase/fix-policies.sql`
3. Cole e execute (Ctrl+Enter)

Isso vai:
- ✅ Remover policies antigas que exigiam autenticação
- ✅ Criar novas policies que permitem acesso com anon key
- ✅ Permitir CRUD completo de cursos e aulas

### Passo 2: Verificar se funcionou

Execute no SQL Editor:

```sql
-- Ver as policies ativas
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('courses', 'lessons');
```

Deve mostrar 8 policies (4 para courses, 4 para lessons):
- `courses_select_all`
- `courses_insert_all`
- `courses_update_all`
- `courses_delete_all`
- `lessons_select_all`
- `lessons_insert_all`
- `lessons_update_all`
- `lessons_delete_all`

### Passo 3: Testar no front-end

1. Reinicie o dev server (se necessário)
2. Acesse `/admin/cursos`
3. Clique em "Novo Curso"
4. Preencha os campos
5. Faça upload de uma imagem
6. Clique em "Salvar Curso"

Deve funcionar sem erros! ✅

## 📋 Checklist

- [ ] Executei o arquivo `fix-policies.sql` no Supabase
- [ ] Verifiquei que as 8 policies foram criadas
- [ ] Testei criar um curso no admin
- [ ] O curso foi salvo com sucesso
- [ ] A imagem foi enviada para o Storage
- [ ] O curso aparece na listagem

## ⚠️ Nota de Segurança

Estas policies permitem acesso total via anon key. Para produção, você deve:

1. Implementar autenticação de admin
2. Adicionar verificação de role/permissão
3. Restringir operações de escrita apenas para admins autenticados

Mas para desenvolvimento, está perfeito! 🚀

## 🆘 Se ainda der erro

Verifique:

1. **ANON_KEY está correta?**
   - Vá em Settings > API no Supabase
   - Copie a "anon public" key
   - Cole no `.env` como `VITE_SUPABASE_ANON_KEY`

2. **RLS está habilitado?**
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE tablename IN ('courses', 'lessons');
   ```
   Deve mostrar `rowsecurity = true`

3. **Bucket 'images' existe e é público?**
   - Vá em Storage
   - Verifique se o bucket `images` existe
   - Deve estar marcado como "Public"

4. **Storage tem policies?**
   ```sql
   SELECT name, definition 
   FROM storage.policies 
   WHERE bucket_id = 'images';
   ```
