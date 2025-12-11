-- ============================================
-- FIX: REMOVER POLICIES RECURSIVAS
-- Execute este SQL para corrigir o erro 500
-- ============================================

-- PASSO 1: Remover todas as policies problemáticas
DROP POLICY IF EXISTS "Moderators can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Moderators can view enrollments" ON enrollments;
DROP POLICY IF EXISTS "Moderators can view turmas" ON turmas;
DROP POLICY IF EXISTS "Moderators can view courses" ON courses;
DROP POLICY IF EXISTS "Moderators can view lessons" ON lessons;
DROP POLICY IF EXISTS "Moderators can view payments" ON payments;
DROP POLICY IF EXISTS "Moderators can view refunds" ON refunds;
DROP POLICY IF EXISTS "Moderators can view banners" ON banners;
DROP POLICY IF EXISTS "Moderators can view professors" ON professors;
DROP POLICY IF EXISTS "Moderators can view tags" ON tags;
DROP POLICY IF EXISTS "Moderators can view testimonials" ON testimonials;
DROP POLICY IF EXISTS "Moderators can view faqs" ON faqs;

-- PASSO 2: Criar função helper (SECURITY DEFINER evita recursão)
CREATE OR REPLACE FUNCTION is_admin_or_moderator()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM profiles WHERE id = auth.uid();
  RETURN COALESCE(user_role IN ('admin', 'moderator'), FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- PASSO 3: Recriar policies usando a função
CREATE POLICY "Admins/Moderators can view profiles" ON profiles FOR SELECT TO authenticated USING (is_admin_or_moderator());
CREATE POLICY "Admins/Moderators can view enrollments" ON enrollments FOR SELECT TO authenticated USING (is_admin_or_moderator());
CREATE POLICY "Admins/Moderators can view turmas" ON turmas FOR SELECT TO authenticated USING (is_admin_or_moderator());
CREATE POLICY "Admins/Moderators can view courses" ON courses FOR SELECT TO authenticated USING (is_admin_or_moderator());
CREATE POLICY "Admins/Moderators can view lessons" ON lessons FOR SELECT TO authenticated USING (is_admin_or_moderator());
CREATE POLICY "Admins/Moderators can view payments" ON payments FOR SELECT TO authenticated USING (is_admin_or_moderator());
CREATE POLICY "Admins/Moderators can view refunds" ON refunds FOR SELECT TO authenticated USING (is_admin_or_moderator());
CREATE POLICY "Admins/Moderators can view banners" ON banners FOR SELECT TO authenticated USING (is_admin_or_moderator());
CREATE POLICY "Admins/Moderators can view professors" ON professors FOR SELECT TO authenticated USING (is_admin_or_moderator());
CREATE POLICY "Admins/Moderators can view tags" ON tags FOR SELECT TO authenticated USING (is_admin_or_moderator());
CREATE POLICY "Admins/Moderators can view faqs" ON faqs FOR SELECT TO authenticated USING (is_admin_or_moderator());

-- Verificar
SELECT '✅ Policies corrigidas! Erro 500 resolvido.' as status;
