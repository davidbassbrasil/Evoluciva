-- =============================================
-- TABELA DE BANNERS
-- =============================================
-- Esta tabela armazena os banners do site
-- com upload de imagens para o Supabase Storage

-- ⚠️ ANTES DE EXECUTAR ESTE SQL:
-- 1. Vá em Storage no Supabase Dashboard
-- 2. Clique em "Create a new bucket"
-- 3. Nome: "images"
-- 4. Marque "Public bucket" (importante!)
-- 5. Clique em "Create bucket"
-- 6. Depois execute este SQL

-- 1. Criar a tabela de banners
CREATE TABLE IF NOT EXISTS public.banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Criar índice para ordenação
CREATE INDEX IF NOT EXISTS idx_banners_order ON public.banners("order");

-- 3. Ativar Row Level Security (RLS)
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS para ADMIN

-- Admin pode ver todos os banners
CREATE POLICY "Admins podem visualizar banners"
ON public.banners
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Admin pode inserir banners
CREATE POLICY "Admins podem inserir banners"
ON public.banners
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Admin pode atualizar banners
CREATE POLICY "Admins podem atualizar banners"
ON public.banners
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Admin pode deletar banners
CREATE POLICY "Admins podem deletar banners"
ON public.banners
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- 5. Política pública para visualização (usuários não autenticados podem ver banners no site)
CREATE POLICY "Qualquer um pode visualizar banners"
ON public.banners
FOR SELECT
TO anon
USING (true);

-- 6. Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_banners_updated_at
BEFORE UPDATE ON public.banners
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- SUPABASE STORAGE BUCKET
-- =============================================
-- Execute este comando no Supabase Dashboard > Storage:
-- 
-- 1. Criar bucket "images" (se não existir)
-- 2. Configurar como público
-- 3. Tamanho máximo do arquivo: 400KB
-- 4. Tipos permitidos: image/jpeg, image/png, image/gif, image/webp

-- Políticas de Storage para o bucket "images"
-- Execute no SQL Editor após criar o bucket:

-- Permitir que admins façam upload
CREATE POLICY "Admins podem fazer upload de imagens"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'images'
  AND (storage.foldername(name))[1] = 'banners'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Permitir que todos visualizem imagens
CREATE POLICY "Qualquer um pode visualizar imagens"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'images');

-- Permitir que admins deletem imagens
CREATE POLICY "Admins podem deletar imagens"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'images'
  AND (storage.foldername(name))[1] = 'banners'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- =============================================
-- COMO USAR
-- =============================================
-- 1. Execute este SQL no Supabase SQL Editor
-- 2. Vá em Storage > Create bucket > Nome: "images" > Public: Yes
-- 3. Configure o tamanho máximo em Storage > images > Settings:
--    - File size limit: 400 KB
--    - Allowed MIME types: image/jpeg, image/png, image/gif, image/webp
-- 4. Pronto! O admin pode fazer upload de imagens via interface
