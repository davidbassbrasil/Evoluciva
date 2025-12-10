-- ============================================
-- CONFIGURAÇÃO COMPLETA - EXECUTAR UMA VEZ
-- ============================================
-- Este arquivo corrige todas as policies de uma vez
-- Execute no SQL Editor do Supabase
-- ============================================

-- ============================================
-- PARTE 1: LIMPAR POLICIES ANTIGAS
-- ============================================

-- Remover policies antigas de courses
DROP POLICY IF EXISTS "Permitir leitura pública de cursos ativos" ON public.courses;
DROP POLICY IF EXISTS "Permitir leitura de todos os cursos para autenticados" ON public.courses;
DROP POLICY IF EXISTS "Permitir inserção de cursos para autenticados" ON public.courses;
DROP POLICY IF EXISTS "Permitir atualização de cursos para autenticados" ON public.courses;
DROP POLICY IF EXISTS "Permitir exclusão de cursos para autenticados" ON public.courses;

-- Remover policies antigas de lessons
DROP POLICY IF EXISTS "Permitir leitura pública de aulas" ON public.lessons;
DROP POLICY IF EXISTS "Permitir inserção de aulas para autenticados" ON public.lessons;
DROP POLICY IF EXISTS "Permitir atualização de aulas para autenticados" ON public.lessons;
DROP POLICY IF EXISTS "Permitir exclusão de aulas para autenticados" ON public.lessons;

-- Remover policies antigas de storage
DROP POLICY IF EXISTS "Permitir leitura pública de imagens" ON storage.objects;
DROP POLICY IF EXISTS "Permitir upload para autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Permitir atualização para autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Permitir exclusão para autenticados" ON storage.objects;
DROP POLICY IF EXISTS "images_select_all" ON storage.objects;
DROP POLICY IF EXISTS "images_insert_all" ON storage.objects;
DROP POLICY IF EXISTS "images_update_all" ON storage.objects;
DROP POLICY IF EXISTS "images_delete_all" ON storage.objects;

-- ============================================
-- PARTE 2: POLICIES CORRETAS - COURSES
-- ============================================

CREATE POLICY "courses_select_all"
  ON public.courses
  FOR SELECT
  USING (true);

CREATE POLICY "courses_insert_all"
  ON public.courses
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "courses_update_all"
  ON public.courses
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "courses_delete_all"
  ON public.courses
  FOR DELETE
  USING (true);

-- ============================================
-- PARTE 3: POLICIES CORRETAS - LESSONS
-- ============================================

CREATE POLICY "lessons_select_all"
  ON public.lessons
  FOR SELECT
  USING (true);

CREATE POLICY "lessons_insert_all"
  ON public.lessons
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "lessons_update_all"
  ON public.lessons
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "lessons_delete_all"
  ON public.lessons
  FOR DELETE
  USING (true);

-- ============================================
-- PARTE 4: POLICIES DE STORAGE
-- ============================================

CREATE POLICY "images_select_all"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'images');

CREATE POLICY "images_insert_all"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'images');

CREATE POLICY "images_update_all"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'images')
  WITH CHECK (bucket_id = 'images');

CREATE POLICY "images_delete_all"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'images');

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================
-- Execute estas queries para confirmar:

-- Ver policies de courses e lessons
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('courses', 'lessons')
ORDER BY tablename, cmd;

-- Ver policies de storage
SELECT policyname, bucket_id 
FROM storage.policies 
WHERE bucket_id = 'images'
ORDER BY policyname;

-- ============================================
-- RESULTADO ESPERADO
-- ============================================
-- Deve mostrar:
-- - 4 policies para 'courses' (SELECT, INSERT, UPDATE, DELETE)
-- - 4 policies para 'lessons' (SELECT, INSERT, UPDATE, DELETE)
-- - 4 policies para storage 'images' (SELECT, INSERT, UPDATE, DELETE)
-- Total: 12 policies
-- ============================================

-- ✅ PRONTO! Agora teste criar um curso no admin.
