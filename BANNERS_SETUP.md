# Configuração do Sistema de Banners

## 📋 Passo a Passo

### 1. Criar a Tabela no Supabase

1. Acesse o Supabase Dashboard: https://app.supabase.com
2. Selecione seu projeto
3. Vá em **SQL Editor** (menu lateral)
4. Cole o conteúdo do arquivo `supabase/banners_table.sql`
5. Clique em **Run** para executar

### 2. Configurar o Storage Bucket

1. No Supabase Dashboard, vá em **Storage** (menu lateral)
2. Clique em **Create a new bucket**
3. Configure:
   - **Name:** `images`
   - **Public bucket:** ✅ Ativado
   - Clique em **Create bucket**

4. Configure limites do bucket:
   - Clique no bucket `images`
   - Vá em **Settings** (ícone de engrenagem)
   - Configure:
     - **File size limit:** `400 KB` (400000 bytes)
     - **Allowed MIME types:** `image/jpeg,image/png,image/gif,image/webp`
   - Salve as alterações

5. Configure as políticas de storage:
   - Vá em **Policies** dentro do bucket
   - Certifique-se que as policies do SQL foram criadas
   - Se necessário, execute novamente a parte de Storage Policies do SQL

### 3. Testar a Funcionalidade

1. Faça login como admin no sistema: `/admin/login`
2. Acesse **Banners** no menu lateral
3. Clique em **+ Novo**
4. Preencha:
   - Selecione uma imagem (máx. 400KB)
   - Digite um título
   - Digite um subtítulo
   - (Opcional) Texto e link do botão CTA
5. Clique em **Salvar Banner**

### 4. Funcionalidades Disponíveis

✅ **Upload de imagem** (máx. 400KB)
- Validação de tamanho
- Validação de tipo (apenas imagens)
- Preview antes de salvar
- Upload automático para Supabase Storage

✅ **CRUD completo**
- Criar novo banner
- Editar banner existente
- Excluir banner (com confirmação)

✅ **Ordenação**
- Botões ⬆️ ⬇️ para reordenar
- Ordem salva no banco de dados
- Reflete na ordem de exibição no site

✅ **Validações**
- Título obrigatório
- Subtítulo obrigatório
- Imagem obrigatória
- Tamanho máximo: 400KB

## 🔒 Segurança (RLS)

As políticas de segurança garantem:
- ✅ Apenas admins podem criar/editar/deletar banners
- ✅ Apenas admins podem fazer upload de imagens
- ✅ Usuários não autenticados podem visualizar banners (para o site)
- ✅ Todos podem visualizar as imagens públicas

## 🗂️ Estrutura da Tabela

```sql
banners {
  id: UUID (primary key)
  title: TEXT (obrigatório)
  subtitle: TEXT (obrigatório)
  image: TEXT (URL da imagem, obrigatório)
  cta_text: TEXT (opcional)
  cta_link: TEXT (opcional)
  order: INTEGER (ordem de exibição)
  created_at: TIMESTAMPTZ
  updated_at: TIMESTAMPTZ (atualizado automaticamente)
}
```

## 📦 Storage

Estrutura de pastas no bucket `images`:
```
images/
  └── banners/
      ├── abc123.jpg
      ├── def456.png
      └── ghi789.webp
```

## 🐛 Troubleshooting

### Erro ao fazer upload
- Verifique se o bucket `images` foi criado
- Verifique se o bucket está configurado como **público**
- Verifique se as policies de storage foram criadas
- Verifique se a imagem tem menos de 400KB

### Erro ao salvar banner
- Verifique se a tabela `banners` foi criada
- Verifique se as RLS policies foram criadas
- Verifique se você está logado como admin
- Verifique se o perfil do admin tem `role = 'admin'` no banco

### Não consigo ver os banners
- Verifique se a policy pública de SELECT está ativa
- Verifique se há banners cadastrados no banco

## 📝 Notas Importantes

1. O sistema tenta carregar do Supabase primeiro, depois fallback para localStorage
2. Imagens são armazenadas permanentemente no Supabase Storage
3. A URL da imagem é salva na coluna `image` da tabela
4. Ao deletar um banner, a imagem permanece no storage (você pode limpar manualmente se desejar)
