-- ============================================
-- FIX: Create Missing Profiles for Existing Users
-- ============================================

-- Este script crea perfiles para usuarios que existen en auth.users
-- pero no tienen un registro en public.profiles

-- 1. Ver usuarios sin perfil
SELECT
  u.id,
  u.email,
  u.created_at,
  CASE WHEN p.id IS NULL THEN '❌ SIN PERFIL' ELSE '✅ CON PERFIL' END as status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC;

-- 2. Crear perfiles para usuarios que no tienen
-- IMPORTANTE: Ajusta el role según corresponda (admin o worker)

INSERT INTO public.profiles (id, email, full_name, role)
SELECT
  u.id,
  u.email,
  COALESCE(
    u.raw_user_meta_data->>'full_name',
    split_part(u.email, '@', 1)
  ) as full_name,
  COALESCE(
    (u.raw_user_meta_data->>'role')::user_role,
    'worker'::user_role
  ) as role
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- 3. Verificar que todos los usuarios ahora tienen perfil
SELECT
  COUNT(*) as total_users,
  COUNT(p.id) as users_with_profile,
  COUNT(*) - COUNT(p.id) as users_without_profile
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id;

-- 4. Ver todos los perfiles creados
SELECT
  email,
  full_name,
  role,
  created_at
FROM public.profiles
ORDER BY created_at DESC;

-- ============================================
-- Si necesitas actualizar roles manualmente:
-- ============================================

-- Cambiar usuario a ADMIN:
-- UPDATE public.profiles SET role = 'admin', full_name = 'Admin User' WHERE email = 'tu-email@ejemplo.com';

-- Cambiar usuario a WORKER:
-- UPDATE public.profiles SET role = 'worker', full_name = 'Trabajador' WHERE email = 'trabajador@ejemplo.com';
