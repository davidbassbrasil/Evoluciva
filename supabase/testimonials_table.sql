-- =============================================
-- TABELA DE DEPOIMENTOS
-- =============================================
-- Esta tabela armazena os depoimentos de alunos
-- com upload de foto para o Supabase Storage

-- ⚠️ ANTES DE EXECUTAR ESTE SQL:
-- Certifique-se que o bucket "images" já foi criado
-- (criado anteriormente para banners)

-- 1. Criar a tabela de depoimentos
CREATE TABLE IF NOT EXISTS public.testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  text TEXT NOT NULL,
  avatar TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Criar índice para ordenação por data
CREATE INDEX IF NOT EXISTS idx_testimonials_created_at ON public.testimonials(created_at DESC);

-- 3. Ativar Row Level Security (RLS)
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS para ADMIN

-- Admin pode ver todos os depoimentos
CREATE POLICY "Admins podem visualizar depoimentos"
ON public.testimonials
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Admin pode inserir depoimentos
CREATE POLICY "Admins podem inserir depoimentos"
ON public.testimonials
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Admin pode atualizar depoimentos
CREATE POLICY "Admins podem atualizar depoimentos"
ON public.testimonials
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

-- Admin pode deletar depoimentos
CREATE POLICY "Admins podem deletar depoimentos"
ON public.testimonials
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- 5. Política pública para visualização (usuários não autenticados podem ver depoimentos no site)
CREATE POLICY "Qualquer um pode visualizar depoimentos"
ON public.testimonials
FOR SELECT
TO anon
USING (true);

-- 6. Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_testimonials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_testimonials_timestamp
BEFORE UPDATE ON public.testimonials
FOR EACH ROW
EXECUTE FUNCTION update_testimonials_updated_at();

-- =============================================
-- STORAGE POLICIES
-- =============================================
-- As policies de storage já foram criadas em banners_table.sql
-- Apenas certifique-se que o bucket "images" existe e é público

-- Políticas adicionais para a pasta testimonials:

-- Permitir que admins façam upload de fotos de depoimentos
CREATE POLICY "Admins podem fazer upload de fotos de depoimentos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'images'
  AND (storage.foldername(name))[1] = 'testimonials'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Permitir que admins deletem fotos de depoimentos
CREATE POLICY "Admins podem deletar fotos de depoimentos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'images'
  AND (storage.foldername(name))[1] = 'testimonials'
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
-- 2. O bucket "images" já deve existir (criado para banners)
-- 3. Fotos serão salvas em: images/testimonials/
-- 4. Tamanho máximo: 100KB (validado no frontend)
-- 5. Pronto! O admin pode gerenciar depoimentos via interface
