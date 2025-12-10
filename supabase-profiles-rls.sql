-- ============================================
-- CONFIGURACIÓN RLS PARA TABLA PROFILES
-- ============================================
-- Ejecuta esto en Supabase SQL Editor si tienes errores 406 al acceder a profiles

-- Verificar si la tabla existe
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles';

-- Habilitar Row Level Security
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Usuarios pueden leer su propio perfil" ON profiles;
DROP POLICY IF EXISTS "Usuarios pueden leer perfiles públicos" ON profiles;
DROP POLICY IF EXISTS "Usuarios pueden actualizar su propio perfil" ON profiles;
DROP POLICY IF EXISTS "Usuarios pueden crear su propio perfil" ON profiles;

-- Política: Usuarios autenticados pueden leer su propio perfil
CREATE POLICY "Usuarios pueden leer su propio perfil"
ON profiles 
FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

-- Política: Todos pueden leer perfiles (para búsquedas públicas)
-- Ajusta según tus necesidades de privacidad
CREATE POLICY "Todos pueden leer perfiles públicos"
ON profiles 
FOR SELECT 
TO public 
USING (true);

-- Política: Usuarios pueden actualizar su propio perfil
CREATE POLICY "Usuarios pueden actualizar su propio perfil"
ON profiles 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Política: Usuarios pueden crear su propio perfil
CREATE POLICY "Usuarios pueden crear su propio perfil"
ON profiles 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);

-- Comentarios
COMMENT ON TABLE profiles IS 'Perfiles de usuario. RLS habilitado para control de acceso.';









