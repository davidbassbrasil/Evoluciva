-- ============================================
-- STORAGE POLICIES - BUCKET IMAGES
-- ============================================
-- Execute este arquivo para configurar as policies
-- do storage bucket 'images'
-- ============================================

-- 1. Remover policies antigas (se existirem)
DROP POLICY IF EXISTS "Permitir leitura pública de imagens" ON storage.objects;
DROP POLICY IF EXISTS "Permitir upload para autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Permitir atualização para autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Permitir exclusão para autenticados" ON storage.objects;
DROP POLICY IF EXISTS "images_select_all" ON storage.objects;
DROP POLICY IF EXISTS "images_insert_all" ON storage.objects;
DROP POLICY IF EXISTS "images_update_all" ON storage.objects;
DROP POLICY IF EXISTS "images_delete_all" ON storage.objects;

-- ============================================
-- 2. CRIAR POLICIES CORRETAS
-- ============================================

-- Permitir leitura pública (qualquer um pode ver as imagens)
CREATE POLICY "images_select_all"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'images');

-- Permitir upload (qualquer um pode fazer upload - ajustar conforme necessário)
CREATE POLICY "images_insert_all"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'images');

-- Permitir atualização
CREATE POLICY "images_update_all"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'images')
  WITH CHECK (bucket_id = 'images');

-- Permitir exclusão
CREATE POLICY "images_delete_all"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'images');

-- ============================================
-- 3. VERIFICAÇÃO
-- ============================================
-- Execute para verificar:
-- SELECT policyname, bucket_id, definition 
-- FROM storage.policies 
-- WHERE bucket_id = 'images';

-- ============================================
-- IMPORTANTE
-- ============================================
-- Se o bucket 'images' não existir, você precisa criá-lo:
-- 1. Vá em Storage no dashboard
-- 2. Clique em "New bucket"
-- 3. Nome: images
-- 4. MARQUE "Public bucket"
-- 5. Create
--
-- Depois execute este SQL para as policies.
-- ============================================
