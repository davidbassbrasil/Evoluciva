-- Create simple key/value settings table for app-level flags
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default flag for active_aluno_financeiro if not exists
INSERT INTO app_settings (key, value)
SELECT 'active_aluno_financeiro', 'true'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM app_settings WHERE key = 'active_aluno_financeiro');

-- Insert default flag for active_aluno_modulos if not exists
INSERT INTO app_settings (key, value)
SELECT 'active_aluno_modulos', 'true'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM app_settings WHERE key = 'active_aluno_modulos');

-- Grant minimal policies: enable RLS and allow safe access.
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Allow any authenticated user to SELECT app settings (read-only).
DROP POLICY IF EXISTS "Authenticated can read app_settings" ON app_settings;
CREATE POLICY "Authenticated can read app_settings"
ON app_settings
FOR SELECT
TO authenticated
USING (true);

-- Restrict INSERT/UPDATE/DELETE to admins and permitted moderators only.
DROP POLICY IF EXISTS "Admins and permitted moderators can manage app_settings" ON app_settings;
CREATE POLICY "Admins and permitted moderators can manage app_settings"
ON app_settings
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'admin'
  )
  OR
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN user_permissions up ON up.user_id = p.id
    WHERE p.id = auth.uid()
    AND p.role = 'moderator'
    AND up.permission_key = 'app_settings'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'admin'
  )
  OR
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN user_permissions up ON up.user_id = p.id
    WHERE p.id = auth.uid()
    AND p.role = 'moderator'
    AND up.permission_key = 'app_settings'
  )
);
