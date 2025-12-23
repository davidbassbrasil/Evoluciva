-- =============================================
-- STORAGE POLICIES PARA POPUPS (bucket: images, pasta: popups)
-- =============================================
-- Execute este SQL no Supabase SQL Editor após garantir que o bucket "images" existe.

-- Permitir que admins façam upload de imagens para images/popups
DROP POLICY IF EXISTS "Admins podem fazer upload de imagens popups" ON storage.objects;
CREATE POLICY "Admins podem fazer upload de imagens popups"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'images'
  AND (storage.foldername(name))[1] = 'popups'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Permitir que admins deletem imagens em images/popups
DROP POLICY IF EXISTS "Admins podem deletar imagens popups" ON storage.objects;
CREATE POLICY "Admins podem deletar imagens popups"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'images'
  AND (storage.foldername(name))[1] = 'popups'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Permitir que qualquer um visualize imagens do bucket images (se o bucket for público)
DROP POLICY IF EXISTS "Qualquer um pode visualizar imagens" ON storage.objects;
CREATE POLICY "Qualquer um pode visualizar imagens"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'images');

-- Observações:
-- 1) Se o bucket "images" não for público, ajuste a política de SELECT conforme a sua necessidade.
-- 2) Não é necessário criar subpastas manualmente no Storage; ao enviar um objeto com prefixo "popups/" ele será armazenado nessa "pasta" virtual.
-- 3) Após executar, admins autenticados poderão inserir e deletar objetos cujo caminho inicie com "popups/".
