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

-- Grant minimal policies: allow admins (via profiles.role) to update/insert/select
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage app_settings" ON app_settings;
CREATE POLICY "Admins and permitted moderators can manage app_settings"
ON app_settings
FOR ALL
TO authenticated
USING (
  -- Allow full access to admins
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'admin'
  )
  OR
  -- Allow moderators only if they have the explicit 'app_settings' permission
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
