-- Fix RLS policies for public content tables
-- These tables should be readable by everyone (including anonymous users)

-- =======================
-- BANNERS TABLE
-- =======================
DROP POLICY IF EXISTS "banners_select_all" ON banners;
CREATE POLICY "banners_select_all" ON banners FOR SELECT USING (true);

DROP POLICY IF EXISTS "banners_insert_all" ON banners;
CREATE POLICY "banners_insert_all" ON banners FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "banners_update_all" ON banners;
CREATE POLICY "banners_update_all" ON banners FOR UPDATE USING (true);

DROP POLICY IF EXISTS "banners_delete_all" ON banners;
CREATE POLICY "banners_delete_all" ON banners FOR DELETE USING (true);

-- =======================
-- PROFESSORS TABLE
-- =======================
DROP POLICY IF EXISTS "professors_select_all" ON professors;
CREATE POLICY "professors_select_all" ON professors FOR SELECT USING (true);

DROP POLICY IF EXISTS "professors_insert_all" ON professors;
CREATE POLICY "professors_insert_all" ON professors FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "professors_update_all" ON professors;
CREATE POLICY "professors_update_all" ON professors FOR UPDATE USING (true);

DROP POLICY IF EXISTS "professors_delete_all" ON professors;
CREATE POLICY "professors_delete_all" ON professors FOR DELETE USING (true);

-- =======================
-- TAGS TABLE
-- =======================
DROP POLICY IF EXISTS "tags_select_all" ON tags;
CREATE POLICY "tags_select_all" ON tags FOR SELECT USING (true);

DROP POLICY IF EXISTS "tags_insert_all" ON tags;
CREATE POLICY "tags_insert_all" ON tags FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "tags_update_all" ON tags;
CREATE POLICY "tags_update_all" ON tags FOR UPDATE USING (true);

DROP POLICY IF EXISTS "tags_delete_all" ON tags;
CREATE POLICY "tags_delete_all" ON tags FOR DELETE USING (true);

-- =======================
-- TESTIMONIALS TABLE
-- =======================
DROP POLICY IF EXISTS "testimonials_select_all" ON testimonials;
CREATE POLICY "testimonials_select_all" ON testimonials FOR SELECT USING (true);

DROP POLICY IF EXISTS "testimonials_insert_all" ON testimonials;
CREATE POLICY "testimonials_insert_all" ON testimonials FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "testimonials_update_all" ON testimonials;
CREATE POLICY "testimonials_update_all" ON testimonials FOR UPDATE USING (true);

DROP POLICY IF EXISTS "testimonials_delete_all" ON testimonials;
CREATE POLICY "testimonials_delete_all" ON testimonials FOR DELETE USING (true);

-- =======================
-- FAQS TABLE
-- =======================
DROP POLICY IF EXISTS "faqs_select_all" ON faqs;
CREATE POLICY "faqs_select_all" ON faqs FOR SELECT USING (true);

DROP POLICY IF EXISTS "faqs_insert_all" ON faqs;
CREATE POLICY "faqs_insert_all" ON faqs FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "faqs_update_all" ON faqs;
CREATE POLICY "faqs_update_all" ON faqs FOR UPDATE USING (true);

DROP POLICY IF EXISTS "faqs_delete_all" ON faqs;
CREATE POLICY "faqs_delete_all" ON faqs FOR DELETE USING (true);

-- Verificar se as políticas foram criadas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename IN ('banners', 'professors', 'tags', 'testimonials', 'faqs')
ORDER BY tablename, policyname;
