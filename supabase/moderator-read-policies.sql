-- ============================================
-- POLICIES RLS PARA MODERADORES
-- Permite moderadores verem os dados necessários
-- ============================================

-- Função helper para verificar role (evita recursão)
CREATE OR REPLACE FUNCTION is_admin_or_moderator()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM profiles WHERE id = auth.uid();
  RETURN user_role IN ('admin', 'moderator');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PROFILES: Admins e Moderadores podem ver todos os profiles
DROP POLICY IF EXISTS "Moderators can view all profiles" ON profiles;
CREATE POLICY "Moderators can view all profiles"
ON profiles FOR SELECT TO authenticated
USING (is_admin_or_moderator());

-- ENROLLMENTS: Moderadores podem ver matrículas
DROP POLICY IF EXISTS "Moderators can view enrollments" ON enrollments;
CREATE POLICY "Moderators can view enrollments"
ON enrollments FOR SELECT TO authenticated
USING (is_admin_or_moderator());

-- TURMAS: Moderadores podem ver turmas
DROP POLICY IF EXISTS "Moderators can view turmas" ON turmas;
CREATE POLICY "Moderators can view turmas"
ON turmas FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'moderator')
  )
);

-- COURSES: Moderadores podem ver cursos
DROP POLICY IF EXISTS "Moderators can view courses" ON courses;
CREATE POLICY "Moderators can view courses"
ON courses FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'moderator')
  )
);

-- LESSONS: Moderadores podem ver aulas
DROP POLICY IF EXISTS "Moderators can view lessons" ON lessons;
CREATE POLICY "Moderators can view lessons"
ON lessons FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'moderator')
  )
);

-- PAYMENTS: Moderadores podem ver pagamentos
DROP POLICY IF EXISTS "Moderators can view payments" ON payments;
CREATE POLICY "Moderators can view payments"
ON payments FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'moderator')
  )
);

-- REFUNDS: Moderadores podem ver estornos
DROP POLICY IF EXISTS "Moderators can view refunds" ON refunds;
CREATE POLICY "Moderators can view refunds"
ON refunds FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'moderator')
  )
);

-- BANNERS: Moderadores podem ver banners
DROP POLICY IF EXISTS "Moderators can view banners" ON banners;
CREATE POLICY "Moderators can view banners"
ON banners FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'moderator')
  )
);

-- PROFESSORS: Moderadores podem ver professores
DROP POLICY IF EXISTS "Moderators can view professors" ON professors;
CREATE POLICY "Moderators can view professors"
ON professors FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'moderator')
  )
);

-- TAGS: Moderadores podem ver tags
DROP POLICY IF EXISTS "Moderators can view tags" ON tags;
CREATE POLICY "Moderators can view tags"
ON tags FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'moderator')
  )
);

-- TESTIMONIALS: Moderadores podem ver depoimentos (se tabela existir)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'testimonials') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Moderators can view testimonials" ON testimonials';
        EXECUTE 'CREATE POLICY "Moderators can view testimonials" ON testimonials FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN (''admin'', ''moderator'')))';
    END IF;
END $$;

-- FAQS: Moderadores podem ver FAQ
DROP POLICY IF EXISTS "Moderators can view faqs" ON faqs;
CREATE POLICY "Moderators can view faqs"
ON faqs FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'moderator')
  )
);

-- Verificar
SELECT '✅ Policies RLS criadas! Moderadores agora podem visualizar dados.' as status;
