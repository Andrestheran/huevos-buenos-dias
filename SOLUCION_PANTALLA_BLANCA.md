# 🔧 Solución: Pantalla en Blanco Después de Login

## 🎯 Problema

Después de hacer login como admin o worker, la pantalla queda en blanco.

## 🔍 Causa

Cuando creaste los usuarios desde el panel de Supabase, se crearon en la tabla `auth.users` pero **NO** se crearon automáticamente en la tabla `public.profiles`.

La aplicación requiere que cada usuario tenga un perfil con su rol (admin/worker).

## ✅ Solución Rápida (2 minutos)

### Paso 1: Ir al SQL Editor de Supabase

1. Abre tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Ve a **SQL Editor** (menú izquierdo)
3. Clic en **"New Query"**

### Paso 2: Ejecutar Script de Reparación

Copia y pega este SQL completo:

```sql
-- 1. Ver el problema: usuarios sin perfil
SELECT
  u.id,
  u.email,
  u.created_at,
  CASE WHEN p.id IS NULL THEN '❌ SIN PERFIL' ELSE '✅ CON PERFIL' END as status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC;

-- 2. Crear perfiles automáticamente para usuarios sin perfil
INSERT INTO public.profiles (id, email, full_name, role)
SELECT
  u.id,
  u.email,
  split_part(u.email, '@', 1) as full_name,
  'worker'::user_role as role  -- Por defecto todos son workers
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- 3. Verificar que se crearon
SELECT
  email,
  full_name,
  role,
  created_at
FROM public.profiles
ORDER BY created_at DESC;
```

### Paso 3: Asignar Roles Correctos

Ahora necesitas actualizar los roles. Ejecuta estos comandos según corresponda:

**Para hacer un usuario ADMIN:**
```sql
UPDATE public.profiles
SET role = 'admin', full_name = 'Administrador'
WHERE email = 'admin@tudominio.com';  -- ⬅️ Cambia por tu email de admin
```

**Para hacer un usuario WORKER:**
```sql
UPDATE public.profiles
SET role = 'worker', full_name = 'Juan Pérez'
WHERE email = 'trabajador@tudominio.com';  -- ⬅️ Cambia por tu email
```

### Paso 4: Verificar Todo Está Correcto

```sql
-- Debe mostrar todos tus usuarios con sus roles
SELECT
  email,
  full_name,
  role,
  CASE
    WHEN role = 'admin' THEN '👑 ADMIN'
    WHEN role = 'worker' THEN '👷 WORKER'
  END as tipo
FROM public.profiles;
```

### Paso 5: Probar la Aplicación

1. Cierra sesión en la app (si estás logueado)
2. Refresca el navegador (`Cmd+R` o `Ctrl+R`)
3. Ingresa de nuevo
4. ✅ Ahora debería funcionar correctamente

---

## 🎯 Ejemplo Completo

Si tienes estos usuarios:
- `admin@empresa.com` → Debe ser ADMIN
- `trabajador1@empresa.com` → Debe ser WORKER
- `trabajador2@empresa.com` → Debe ser WORKER

Ejecuta:

```sql
-- Crear perfiles si faltan
INSERT INTO public.profiles (id, email, full_name, role)
SELECT u.id, u.email, split_part(u.email, '@', 1), 'worker'::user_role
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- Asignar rol de admin
UPDATE public.profiles
SET role = 'admin', full_name = 'Administrador Principal'
WHERE email = 'admin@empresa.com';

-- Actualizar nombres de trabajadores
UPDATE public.profiles
SET full_name = 'Juan Pérez'
WHERE email = 'trabajador1@empresa.com';

UPDATE public.profiles
SET full_name = 'María García'
WHERE email = 'trabajador2@empresa.com';

-- Verificar
SELECT email, full_name, role FROM public.profiles;
```

---

## 🔐 Para Prevenir Este Problema en el Futuro

### Opción 1: Usar la Función de Sign Up (Recomendado)

En lugar de crear usuarios directamente en Supabase, usa esta función SQL:

```sql
-- Crear usuario admin
SELECT create_user_with_profile(
  'nuevo-admin@empresa.com',
  'password123',
  'Nombre Admin',
  'admin'::user_role
);

-- Crear usuario worker
SELECT create_user_with_profile(
  'nuevo-trabajador@empresa.com',
  'password123',
  'Nombre Trabajador',
  'worker'::user_role
);
```

**Nota**: Esta función aún no existe, pero puedes crearla así:

```sql
CREATE OR REPLACE FUNCTION create_user_with_profile(
  user_email TEXT,
  user_password TEXT,
  user_full_name TEXT,
  user_role user_role DEFAULT 'worker'
)
RETURNS TEXT AS $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Crear usuario en auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    user_email,
    crypt(user_password, gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('full_name', user_full_name, 'role', user_role)
  )
  RETURNING id INTO new_user_id;

  -- Crear perfil automáticamente
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (new_user_id, user_email, user_full_name, user_role);

  RETURN 'Usuario creado: ' || user_email || ' (ID: ' || new_user_id || ')';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Opción 2: Usar Trigger Automático

Agrega un trigger que cree el perfil automáticamente:

```sql
-- Función que se ejecuta al crear usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'worker'::user_role)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que se dispara al crear usuario
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

Con este trigger, cada vez que crees un usuario en Supabase, automáticamente se creará su perfil.

---

## 🧪 Verificación Final

Después de aplicar la solución, verifica:

1. **Todos los usuarios tienen perfil:**
   ```sql
   SELECT COUNT(*) FROM auth.users;  -- Ejemplo: 3
   SELECT COUNT(*) FROM public.profiles;  -- Debe ser igual: 3
   ```

2. **Roles correctos:**
   ```sql
   SELECT email, role FROM public.profiles;
   ```

3. **Login funciona:**
   - Login como admin → Debe ir a `/admin` y mostrar dashboard
   - Login como worker → Debe ir a `/production` y mostrar formulario

---

## ❓ Preguntas Frecuentes

### ¿Por qué pasa esto?

Supabase separa la autenticación (`auth.users`) de los datos de usuario (`public.profiles`). Cuando creas usuarios desde el panel, solo se crea en `auth.users`. La app requiere datos adicionales (nombre, rol) que están en `profiles`.

### ¿Es seguro ejecutar estos scripts?

Sí, todos estos scripts solo **insertan** o **actualizan** datos. No eliminan nada. De todas formas, Supabase tiene backups automáticos.

### ¿Debo ejecutar esto cada vez que creo un usuario?

No si instalas el trigger automático (Opción 2 arriba). Con el trigger, cada nuevo usuario tendrá perfil automáticamente.

### Ya ejecuté el script pero sigue en blanco

1. Cierra sesión completamente
2. Cierra el navegador
3. Abre de nuevo y prueba
4. Verifica en la consola del navegador (`F12`) si hay errores

---

## 📞 Soporte

Si después de seguir estos pasos sigue sin funcionar:

1. Abre la consola del navegador (`F12`)
2. Ve a la pestaña "Console"
3. Copia cualquier error en rojo
4. Busca ayuda con ese error específico

---

**✅ Esta solución arreglará el 99% de los casos de pantalla en blanco después de login.**

*Última actualización: Febrero 2026*
