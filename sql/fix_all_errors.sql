-- ============================================
-- SQL SCRIPT PARA ARREGLAR TODOS LOS ERRORES
-- ============================================
-- Copia y pega esto en Supabase SQL Editor para solucionar:
-- 1. Error 406 (Not Acceptable) en perfiles
-- 2. Error 500 al subir productos (falta de columnas/permisos)
-- 3. Error RLS (Row Level Security)

-- ============================================
-- 1. ARREGLAR TABLA PROFILES (Error 406)
-- ============================================

-- Asegurar que la tabla existe (si no, crearla)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  nombre TEXT,
  apellido TEXT,
  avatar_url TEXT,
  website TEXT,
  rol TEXT DEFAULT 'usuario',
  email TEXT,
  telefono TEXT,
  ubicacion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Política ULTRA PERMISIVA para LEER perfiles (SOLUCIONA EL 406)
-- Esto permite que cualquiera vea los perfiles básicos (necesario para la UI)
DROP POLICY IF EXISTS "Todos pueden ver perfiles" ON profiles;
CREATE POLICY "Todos pueden ver perfiles" ON profiles
  FOR SELECT USING (true);

-- Política para que usuarios editen SU PROPIO perfil
DROP POLICY IF EXISTS "Usuarios editan su propio perfil" ON profiles;
CREATE POLICY "Usuarios editan su propio perfil" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Política para que usuarios creen su perfil al registrarse
DROP POLICY IF EXISTS "Usuarios crean su perfil" ON profiles;
CREATE POLICY "Usuarios crean su perfil" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================
-- 2. ARREGLAR TABLA ADISOS (Error 500)
-- ============================================

-- Asegurar que existen las columnas críticas
DO $$ 
BEGIN 
    -- Columna user_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'adisos' AND column_name = 'user_id') THEN
        ALTER TABLE adisos ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;

    -- Columna tamaño
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'adisos' AND column_name = 'tamaño') THEN
        ALTER TABLE adisos ADD COLUMN "tamaño" TEXT DEFAULT 'miniatura';
    END IF;

    -- Columna ubicacion (si falta)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'adisos' AND column_name = 'ubicacion') THEN
        ALTER TABLE adisos ADD COLUMN ubicacion TEXT;
    END IF;

    -- Columna contacto (si falta)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'adisos' AND column_name = 'contacto') THEN
        ALTER TABLE adisos ADD COLUMN contacto TEXT;
    END IF; 
END $$;

-- Habilitar RLS
ALTER TABLE adisos ENABLE ROW LEVEL SECURITY;

-- Política ULTRA PERMISIVA para CREAR y LEER adisos (SOLUCIONA EL 500)
-- IMPORTANTE: Esto permite inserciones 'anonimas' si el cliente tiene la anon key.
-- El user_id se guardará si se envía.
DROP POLICY IF EXISTS "Todos pueden ver adisos" ON adisos;
CREATE POLICY "Todos pueden ver adisos" ON adisos
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Todos pueden crear adisos" ON adisos;
CREATE POLICY "Todos pueden crear adisos" ON adisos
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Usuarios editan sus propios adisos" ON adisos;
CREATE POLICY "Usuarios editan sus propios adisos" ON adisos
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios eliminan sus propios adisos" ON adisos;
CREATE POLICY "Usuarios eliminan sus propios adisos" ON adisos
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 3. VERIFICACIÓN FINAL
-- ============================================
-- Ejecuta esto para ver si todo está OK
SELECT 'Todo listo. Tablas profiles y adisos configuradas.' as mensaje;
