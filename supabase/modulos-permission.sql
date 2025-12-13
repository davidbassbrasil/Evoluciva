-- ============================================
-- ADICIONAR PERMISSÃO DE MÓDULOS AO SISTEMA
-- ============================================

-- IMPORTANTE: Este sistema usa 'permission_key' diretamente na tabela user_permissions
-- A chave de permissão para módulos é: 'modulos'

-- ============================================
-- EXEMPLOS DE USO
-- ============================================

-- 1. CONCEDER permissão de módulos a um moderador específico
-- Substitua 'usuario_id_aqui' pelo ID real do usuário
/*
INSERT INTO user_permissions (user_id, permission_key)
VALUES (
  'usuario_id_aqui',
  'modulos'
)
ON CONFLICT (user_id, permission_key) DO NOTHING;
*/

-- 2. CONCEDER permissão para TODOS os moderadores existentes
-- (use com cuidado!)
/*
INSERT INTO user_permissions (user_id, permission_key)
SELECT 
  p.id,
  'modulos'
FROM profiles p
WHERE p.role = 'moderator'
ON CONFLICT (user_id, permission_key) DO NOTHING;
*/

-- 3. REVOGAR permissão de módulos de um usuário específico
/*
DELETE FROM user_permissions
WHERE user_id = 'usuario_id_aqui'
AND permission_key = 'modulos';
*/

-- 4. LISTAR todos os usuários com permissão de módulos
/*
SELECT 
  p.id,
  p.full_name,
  p.email,
  p.role,
  up.created_at as permission_granted_at
FROM profiles p
JOIN user_permissions up ON up.user_id = p.id
WHERE up.permission_key = 'modulos'
ORDER BY p.full_name;
*/

-- ============================================
-- GERENCIAR ROLES E PERMISSÕES
-- ============================================

-- Ver o role atual do Edu Sampaio
SELECT 
  id,
  full_name,
  email,
  role,
  created_at
FROM profiles
WHERE email = 'sampaiosupabase@gmail.com';

-- Para ALTERAR o role do Edu (descomente a opção desejada):

-- Opção 1: Tornar ADMIN (acesso total)
/*
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'sampaiosupabase@gmail.com';
*/

-- Opção 2: Tornar STUDENT (acesso apenas como aluno)
/*
UPDATE profiles 
SET role = 'student' 
WHERE email = 'sampaiosupabase@gmail.com';
*/

-- Opção 3: Manter MODERATOR e conceder permissão de módulos
INSERT INTO user_permissions (user_id, permission_key)
SELECT 
  p.id,
  'modulos'
FROM profiles p
WHERE p.email = 'sampaiosupabase@gmail.com'
ON CONFLICT (user_id, permission_key) DO NOTHING;

-- ============================================
-- VERIFICAÇÕES ÚTEIS
-- ============================================

-- 5. Ver todas as permissões de módulos cadastradas
SELECT 
  p.full_name,
  p.email,
  up.permission_key,
  up.created_at
FROM user_permissions up
JOIN profiles p ON p.id = up.user_id
WHERE up.permission_key = 'modulos'
ORDER BY p.full_name;

-- 6. Ver quais moderadores têm a permissão
SELECT 
  p.full_name,
  p.email,
  CASE 
    WHEN up.user_id IS NOT NULL THEN '✅ Tem permissão'
    ELSE '❌ Sem permissão'
  END as status
FROM profiles p
LEFT JOIN user_permissions up ON up.user_id = p.id AND up.permission_key = 'modulos'
WHERE p.role = 'moderator'
ORDER BY p.full_name;
