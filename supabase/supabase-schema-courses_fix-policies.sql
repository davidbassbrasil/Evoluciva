-- ============================================
-- CORREÇÃO DE POLICIES - CURSOS
-- ============================================
-- Execute este arquivo DEPOIS de criar as tabelas
-- para corrigir as policies e permitir operações sem autenticação
-- (usando anon key com permissões adequadas)
-- ============================================

-- 1. Remover policies antigas
DROP POLICY IF EXISTS "Permitir leitura pública de cursos ativos" ON public.courses;
DROP POLICY IF EXISTS "Permitir leitura de todos os cursos para autenticados" ON public.courses;
DROP POLICY IF EXISTS "Permitir inserção de cursos para autenticados" ON public.courses;
DROP POLICY IF EXISTS "Permitir atualização de cursos para autenticados" ON public.courses;
DROP POLICY IF EXISTS "Permitir exclusão de cursos para autenticados" ON public.courses;

DROP POLICY IF EXISTS "Permitir leitura pública de aulas" ON public.lessons;
DROP POLICY IF EXISTS "Permitir inserção de aulas para autenticados" ON public.lessons;
DROP POLICY IF EXISTS "Permitir atualização de aulas para autenticados" ON public.lessons;
DROP POLICY IF EXISTS "Permitir exclusão de aulas para autenticados" ON public.lessons;

-- ============================================
-- 2. POLICIES CORRETAS - COURSES
-- ============================================

-- Permitir leitura para todos (público e anon)
CREATE POLICY "courses_select_all"
  ON public.courses
  FOR SELECT
  USING (true);

-- Permitir inserção para todos (anon pode inserir)
CREATE POLICY "courses_insert_all"
  ON public.courses
  FOR INSERT
  WITH CHECK (true);

-- Permitir atualização para todos
CREATE POLICY "courses_update_all"
  ON public.courses
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Permitir exclusão para todos
CREATE POLICY "courses_delete_all"
  ON public.courses
  FOR DELETE
  USING (true);

-- ============================================
-- 3. POLICIES CORRETAS - LESSONS
-- ============================================

-- Permitir leitura para todos
CREATE POLICY "lessons_select_all"
  ON public.lessons
  FOR SELECT
  USING (true);

-- Permitir inserção para todos
CREATE POLICY "lessons_insert_all"
  ON public.lessons
  FOR INSERT
  WITH CHECK (true);

-- Permitir atualização para todos
CREATE POLICY "lessons_update_all"
  ON public.lessons
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Permitir exclusão para todos
CREATE POLICY "lessons_delete_all"
  ON public.lessons
  FOR DELETE
  USING (true);

-- ============================================
-- 4. VERIFICAÇÃO
-- ============================================
-- Execute para verificar se as policies foram criadas:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd 
-- FROM pg_policies 
-- WHERE tablename IN ('courses', 'lessons');

-- ============================================
-- IMPORTANTE: SEGURANÇA
-- ============================================
-- ATENÇÃO: Estas policies permitem acesso total para qualquer usuário.
-- Isso é adequado se você:
-- 1. Vai adicionar autenticação de admin no front-end
-- 2. Vai usar RLS mais complexo no futuro
-- 3. Está em desenvolvimento/testes
--
-- Para PRODUÇÃO, considere:
-- 1. Criar uma tabela de admins
-- 2. Usar claims JWT personalizados
-- 3. Restringir INSERT/UPDATE/DELETE apenas para admins autenticados
-- ============================================
