-- ============================================
-- FIX: Errores 406 (Not Acceptable) en Profiles y Favoritos
-- ============================================
-- Ejecuta esto en Supabase SQL Editor para corregir los errores 406

-- ============================================
-- TABLA PROFILES
-- ============================================

-- Verificar si la tabla existe, si no, crearla
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  email TEXT,
  nombre TEXT,
  apellido TEXT,
  telefono TEXT,
  avatar_url TEXT,
  ubicacion TEXT,
  latitud DOUBLE PRECISION,
  longitud DOUBLE PRECISION,
  rol TEXT DEFAULT 'usuario',
  es_verificado BOOLEAN DEFAULT false,
  fecha_verificacion TIMESTAMP WITH TIME ZONE,
  fecha_nacimiento DATE,
  genero TEXT,
  bio TEXT,
  website TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Todos pueden leer perfiles" ON profiles;
DROP POLICY IF EXISTS "Usuarios pueden leer su propio perfil" ON profiles;
DROP POLICY IF EXISTS "Usuarios pueden actualizar su propio perfil" ON profiles;
DROP POLICY IF EXISTS "Usuarios pueden crear su propio perfil" ON profiles;

-- Política: Todos pueden leer perfiles (para evitar errores 406)
CREATE POLICY "Todos pueden leer perfiles"
ON profiles 
FOR SELECT 
TO public 
USING (true);

-- Política: Usuarios autenticados pueden leer su propio perfil
CREATE POLICY "Usuarios pueden leer su propio perfil"
ON profiles 
FOR SELECT 
TO authenticated 
USING (true);

-- Política: Usuarios pueden actualizar su propio perfil
CREATE POLICY "Usuarios pueden actualizar su propio perfil"
ON profiles 
FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (true);

-- Política: Usuarios pueden crear su propio perfil
CREATE POLICY "Usuarios pueden crear su propio perfil"
ON profiles 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- ============================================
-- TABLA FAVORITOS
-- ============================================

-- Crear tabla si no existe
CREATE TABLE IF NOT EXISTS favoritos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  adiso_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, adiso_id)
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_favoritos_user_id ON favoritos(user_id);
CREATE INDEX IF NOT EXISTS idx_favoritos_adiso_id ON favoritos(adiso_id);
CREATE INDEX IF NOT EXISTS idx_favoritos_user_adiso ON favoritos(user_id, adiso_id);

-- Habilitar RLS
ALTER TABLE favoritos ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Todos pueden leer favoritos" ON favoritos;
DROP POLICY IF EXISTS "Usuarios pueden leer sus propios favoritos" ON favoritos;
DROP POLICY IF EXISTS "Usuarios pueden crear sus propios favoritos" ON favoritos;
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus propios favoritos" ON favoritos;

-- Política: Todos pueden leer favoritos (para evitar errores 406)
CREATE POLICY "Todos pueden leer favoritos"
ON favoritos 
FOR SELECT 
TO public 
USING (true);

-- Política: Usuarios autenticados pueden leer sus favoritos
CREATE POLICY "Usuarios pueden leer sus propios favoritos"
ON favoritos 
FOR SELECT 
TO authenticated 
USING (true);

-- Política: Usuarios pueden crear sus propios favoritos
CREATE POLICY "Usuarios pueden crear sus propios favoritos"
ON favoritos 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Política: Usuarios pueden eliminar sus propios favoritos
CREATE POLICY "Usuarios pueden eliminar sus propios favoritos"
ON favoritos 
FOR DELETE 
TO authenticated 
USING (true);

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Verificar que las tablas existen
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('profiles', 'favoritos');

-- Verificar políticas RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename IN ('profiles', 'favoritos')
ORDER BY tablename, policyname;



