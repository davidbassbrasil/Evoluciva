-- =============================================
-- TABELA DE PROFESSORES
-- =============================================
-- Esta tabela armazena os professores dos cursos
-- com upload de foto para o Supabase Storage

-- ⚠️ ANTES DE EXECUTAR ESTE SQL:
-- Certifique-se que o bucket "images" já foi criado
-- (criado anteriormente para banners)

-- 1. Criar a tabela de professores
CREATE TABLE IF NOT EXISTS public.professors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  bio TEXT NOT NULL,
  image TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Criar índices
CREATE INDEX IF NOT EXISTS idx_professors_name ON public.professors(name);
CREATE INDEX IF NOT EXISTS idx_professors_order ON public.professors("order");

-- 3. Ativar Row Level Security (RLS)
ALTER TABLE public.professors ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS para ADMIN

-- Admin pode ver todos os professores
CREATE POLICY "Admins podem visualizar professores"
ON public.professors
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Admin pode inserir professores
CREATE POLICY "Admins podem inserir professores"
ON public.professors
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Admin pode atualizar professores
CREATE POLICY "Admins podem atualizar professores"
ON public.professors
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

-- Admin pode deletar professores
CREATE POLICY "Admins podem deletar professores"
ON public.professors
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- 5. Política pública para visualização (usuários não autenticados podem ver professores no site)
CREATE POLICY "Qualquer um pode visualizar professores"
ON public.professors
FOR SELECT
TO anon
USING (true);

-- 6. Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_professors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_professors_timestamp
BEFORE UPDATE ON public.professors
FOR EACH ROW
EXECUTE FUNCTION update_professors_updated_at();

-- =============================================
-- STORAGE POLICIES
-- =============================================
-- As policies de storage já foram criadas em banners_table.sql
-- Apenas certifique-se que o bucket "images" existe e é público

-- Políticas adicionais para a pasta professors:

-- Permitir que admins façam upload de fotos de professores
CREATE POLICY "Admins podem fazer upload de fotos de professores"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'images'
  AND (storage.foldername(name))[1] = 'professors'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Permitir que admins deletem fotos de professores
CREATE POLICY "Admins podem deletar fotos de professores"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'images'
  AND (storage.foldername(name))[1] = 'professors'
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
-- 3. Fotos serão salvas em: images/professors/
-- 4. Tamanho máximo: 100KB (validado no frontend)
-- 5. Pronto! O admin pode gerenciar professores via interface
