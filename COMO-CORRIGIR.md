# 🚀 SOLUÇÃO RÁPIDA - Corrigir Erro ao Criar Curso

## Problema
Erro ao tentar criar curso no `/admin/cursos` devido a policies RLS incorretas.

## Solução (3 passos)

### ✅ Passo 1: Executar SQL de Correção

1. Abra o **Supabase Dashboard** → seu projeto
2. Vá em **SQL Editor** (menu lateral esquerdo)
3. Clique em **New Query**
4. Copie TODO o conteúdo do arquivo: `supabase/setup-completo.sql`
5. Cole no editor
6. Clique em **Run** (ou Ctrl+Enter)

Aguarde aparecer "Success" ✅

### ✅ Passo 2: Verificar se funcionou

Ainda no SQL Editor, execute:

```sql
SELECT tablename, policyname FROM pg_policies 
WHERE tablename IN ('courses', 'lessons');
```

**Resultado esperado:** 8 linhas mostrando as policies criadas.

Depois execute:

```sql
SELECT policyname FROM storage.policies WHERE bucket_id = 'images';
```

**Resultado esperado:** 4 linhas (policies de storage).

### ✅ Passo 3: Testar no Admin

1. Abra o navegador
2. Vá em `http://localhost:5173/admin/cursos`
3. Clique em **Novo Curso**
4. Preencha os campos:
   - Título: "Curso de Teste"
   - Descrição: "Teste de criação"
   - Professor: "Prof. Teste"
   - (demais campos são opcionais)
5. Faça upload de uma imagem qualquer
6. Clique em **Salvar Curso**

Deve aparecer: **"Curso criado com sucesso!"** 🎉

---

## 📋 Checklist

- [ ] Executei o SQL `setup-completo.sql`
- [ ] Verifiquei que as 12 policies foram criadas (8 + 4)
- [ ] Testei criar um curso no admin
- [ ] O curso foi salvo sem erros
- [ ] A imagem apareceu no preview
- [ ] O curso apareceu na listagem

---

## 🆘 Se ainda não funcionar

### Erro: "Supabase não configurado"
Verifique o arquivo `.env`:
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-aqui
```

Reinicie o servidor:
```powershell
npm run dev
```

### Erro: "permission denied" ou "new row violates row-level security"
As policies não foram aplicadas corretamente. Tente:

1. Desabilitar RLS temporariamente:
```sql
ALTER TABLE public.courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons DISABLE ROW LEVEL SECURITY;
```

2. Reabilitar e aplicar policies novamente:
```sql
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
```

Depois execute o `setup-completo.sql` novamente.

### Erro: "Failed to upload image"
O bucket 'images' não está configurado corretamente:

1. Vá em **Storage** no Supabase
2. Veja se o bucket `images` existe
3. Clique no bucket → **Configuration**
4. Marque **Public bucket** ✅
5. Execute `setup-completo.sql` novamente (para as storage policies)

---

## ✨ Confirmação de Sucesso

Você vai saber que funcionou quando:
1. ✅ Conseguir criar um curso sem erros
2. ✅ A imagem for enviada para o Supabase Storage
3. ✅ O curso aparecer na lista com a imagem
4. ✅ O slug foi gerado automaticamente (ex: `curso-de-teste`)

---

## 📝 Sobre as Policies

As policies criadas permitem acesso **total** (SELECT, INSERT, UPDATE, DELETE) para:
- Tabela `courses`
- Tabela `lessons`
- Storage bucket `images`

Isso é adequado para desenvolvimento. Para produção, você deve implementar autenticação e restringir as operações.
