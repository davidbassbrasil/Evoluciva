# Configuração do Supabase - Sistema de Cursos

Este documento contém as instruções para configurar o banco de dados Supabase para o módulo de gerenciamento de cursos.

## 📋 Pré-requisitos

1. Conta no [Supabase](https://supabase.com)
2. Projeto criado no Supabase
3. Variáveis de ambiente configuradas no arquivo `.env`:
   ```env
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-anon-key-aqui
   ```

## 🗄️ Passo 1: Criar as Tabelas

1. Acesse o dashboard do seu projeto no Supabase
2. Vá em **SQL Editor** (ícone de banco de dados no menu lateral)
3. Clique em **New Query**
4. Copie todo o conteúdo do arquivo `supabase-schema-courses.sql`
5. Cole no editor SQL
6. Clique em **Run** (ou pressione Ctrl+Enter)

### O que será criado:

✅ Tabela `courses` - armazena cursos  
✅ Tabela `lessons` - armazena aulas de cada curso  
✅ Índices para otimização de consultas  
✅ Row Level Security (RLS) habilitado  
✅ Policies de acesso (público + admin)  
✅ Triggers automáticos (updated_at, slug)  
✅ Função para gerar slug automaticamente  

## 🗂️ Passo 2: Configurar Storage para Imagens

### 2.1 Criar o Bucket

1. Vá em **Storage** no menu do Supabase
2. Clique em **New Bucket**
3. Nome: `images`
4. **Marque** a opção "Public bucket" ✅
5. Clique em **Create bucket**

### 2.2 Configurar Policies de Upload

1. Clique no bucket `images`
2. Vá na aba **Policies**
3. Adicione as seguintes policies:

#### Policy 1: Permitir leitura pública
```sql
CREATE POLICY "Permitir leitura pública de imagens"
ON storage.objects FOR SELECT
USING (bucket_id = 'images');
```

#### Policy 2: Permitir upload para autenticados
```sql
CREATE POLICY "Permitir upload para autenticados"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'images');
```

#### Policy 3: Permitir atualização para autenticados
```sql
CREATE POLICY "Permitir atualização para autenticados"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'images')
WITH CHECK (bucket_id = 'images');
```

#### Policy 4: Permitir exclusão para autenticados
```sql
CREATE POLICY "Permitir exclusão para autenticados"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'images');
```

### 2.3 Criar Pastas (opcional)

Dentro do bucket `images`, você pode criar as seguintes pastas para organização:
- `courses/` - imagens dos cursos
- `banners/` - banners da home
- `professors/` - fotos dos professores
- `testimonials/` - fotos de depoimentos

## 🔐 Passo 3: Configurar Autenticação (Admin)

Para acessar o painel administrativo, você precisa criar um usuário:

### Opção A: Via Dashboard do Supabase

1. Vá em **Authentication** → **Users**
2. Clique em **Add User**
3. Preencha:
   - Email: `admin@admin.com` (ou seu email)
   - Password: (escolha uma senha forte)
4. Clique em **Create User**

### Opção B: Via SQL

```sql
-- Substitua 'seu-email@exemplo.com' e 'sua-senha-forte'
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@admin.com',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Administrador"}',
  NOW(),
  NOW()
);
```

## 📊 Passo 4: Verificar Instalação

Execute as seguintes queries para confirmar que tudo foi criado corretamente:

### Verificar tabelas
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('courses', 'lessons');
```
**Resultado esperado:** 2 linhas (courses, lessons)

### Verificar índices
```sql
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename IN ('courses', 'lessons');
```
**Resultado esperado:** Vários índices listados

### Verificar policies (RLS)
```sql
SELECT policyname, tablename, cmd
FROM pg_policies 
WHERE tablename IN ('courses', 'lessons');
```
**Resultado esperado:** Políticas de SELECT, INSERT, UPDATE, DELETE para cada tabela

### Verificar storage bucket
```sql
SELECT * FROM storage.buckets WHERE name = 'images';
```
**Resultado esperado:** 1 linha com bucket 'images' e public = true

## 🧪 Passo 5: Testar o Sistema

### 5.1 Testar Leitura Pública

```sql
-- Deve retornar cursos ativos (mesmo sem estar autenticado)
SELECT id, title, active FROM courses WHERE active = true;
```

### 5.2 Testar Upload de Imagem

1. No front-end, faça login como admin
2. Vá em `/admin/cursos`
3. Clique em **Novo Curso**
4. Preencha os campos e faça upload de uma imagem
5. Verifique no Supabase Storage se a imagem foi enviada

### 5.3 Testar Slug Automático

```sql
-- Inserir curso de teste (slug será gerado automaticamente)
INSERT INTO courses (title, description, instructor, price, original_price)
VALUES ('Teste de Slug Automático', 'Descrição teste', 'Prof. Teste', 100, 150);

-- Verificar se slug foi gerado
SELECT title, slug FROM courses WHERE title = 'Teste de Slug Automático';
-- Esperado: slug = 'teste-de-slug-automatico'
```

## 🎨 Estrutura dos Campos

### Tabela `courses`

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | UUID | Sim | ID único (gerado automaticamente) |
| `title` | TEXT | Sim | Título do curso |
| `description` | TEXT | Sim | Descrição curta (para cards) |
| `full_description` | TEXT | Não | Descrição completa (página individual) |
| `whats_included` | TEXT | Não | Lista do que está incluso |
| `price` | NUMERIC | Sim | Preço atual |
| `original_price` | NUMERIC | Sim | Preço original (para desconto) |
| `image` | TEXT | Não | URL da imagem |
| `instructor` | TEXT | Sim | Nome do professor/equipe |
| `duration` | TEXT | Sim | Duração (ex: "60 horas") |
| `lessons` | INTEGER | Sim | Número de aulas |
| `category` | TEXT | Sim | Categoria do curso |
| `featured` | BOOLEAN | Sim | Destaque na home |
| `active` | BOOLEAN | Sim | Visível na página principal |
| `display_order` | INTEGER | Sim | Ordem de exibição (0 = topo) |
| `slug` | TEXT | Sim | URL amigável (gerado automaticamente) |
| `created_at` | TIMESTAMPTZ | Sim | Data de criação |
| `updated_at` | TIMESTAMPTZ | Sim | Data de atualização |

### Tabela `lessons`

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | UUID | Sim | ID único |
| `course_id` | UUID | Sim | Referência ao curso |
| `title` | TEXT | Sim | Título da aula |
| `description` | TEXT | Não | Descrição da aula |
| `duration` | TEXT | Sim | Duração (ex: "45:00") |
| `video_url` | TEXT | Não | URL do vídeo |
| `order_index` | INTEGER | Sim | Ordem da aula |
| `is_free` | BOOLEAN | Sim | Se é aula grátis (preview) |
| `created_at` | TIMESTAMPTZ | Sim | Data de criação |
| `updated_at` | TIMESTAMPTZ | Sim | Data de atualização |

## 🔒 Políticas de Segurança (RLS)

### Usuários Públicos (não autenticados)
- ✅ Podem **visualizar** cursos ativos (`active = true`)
- ✅ Podem **visualizar** todas as aulas (para ver estrutura do curso)
- ❌ Não podem criar, editar ou excluir

### Usuários Autenticados (admin)
- ✅ Podem **visualizar** todos os cursos (ativos e inativos)
- ✅ Podem **criar** novos cursos
- ✅ Podem **editar** cursos existentes
- ✅ Podem **excluir** cursos
- ✅ Podem gerenciar aulas (CRUD completo)
- ✅ Podem fazer upload de imagens

## 📝 Próximos Passos

Após configurar o Supabase:

1. ✅ Reinicie o servidor de desenvolvimento
2. ✅ Faça login no painel admin (`/admin/login`)
3. ✅ Acesse `/admin/cursos`
4. ✅ Crie seu primeiro curso de teste
5. ✅ Verifique se aparece na página principal (`/`)

## 🆘 Troubleshooting

### "Supabase não configurado"
- Verifique se as variáveis de ambiente estão corretas no `.env`
- Reinicie o servidor após alterar `.env`

### Upload de imagem falha
- Confirme que o bucket `images` existe e é público
- Verifique se as policies de storage foram criadas
- Verifique permissões de CORS no Supabase (geralmente automático)

### Cursos não aparecem na home
- Verifique se o campo `active = true`
- Confirme que o RLS está configurado corretamente
- Teste com: `SELECT * FROM courses WHERE active = true;`

### Erro "permission denied"
- Verifique se você está autenticado (para operações de admin)
- Confirme que as policies RLS foram criadas corretamente

## 📚 Documentação Adicional

- [Documentação oficial do Supabase](https://supabase.com/docs)
- [Row Level Security (RLS)](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage Policies](https://supabase.com/docs/guides/storage/security/access-control)

---

**Autor:** Sistema Evoluciva  
**Data:** Dezembro 2025  
**Versão:** 1.0
