-- ============================================
-- CONFIGURACIÓN RLS PARA TABLA FAVORITOS
-- ============================================
-- Ejecuta esto en Supabase SQL Editor si tienes errores 406 al acceder a favoritos

-- Verificar si la tabla existe
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'favoritos';

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

-- Habilitar Row Level Security
ALTER TABLE favoritos ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Usuarios pueden leer sus propios favoritos" ON favoritos;
DROP POLICY IF EXISTS "Usuarios pueden crear sus propios favoritos" ON favoritos;
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus propios favoritos" ON favoritos;

-- Política: Usuarios pueden leer sus propios favoritos
CREATE POLICY "Usuarios pueden leer sus propios favoritos"
ON favoritos 
FOR SELECT 
TO authenticated 
USING (auth.uid()::text = user_id);

-- Política alternativa: Permitir lectura pública (si no hay autenticación)
-- Descomenta si necesitas acceso sin autenticación
-- CREATE POLICY "Todos pueden leer favoritos"
-- ON favoritos 
-- FOR SELECT 
-- TO public 
-- USING (true);

-- Política: Usuarios pueden crear sus propios favoritos
CREATE POLICY "Usuarios pueden crear sus propios favoritos"
ON favoritos 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid()::text = user_id);

-- Política: Usuarios pueden eliminar sus propios favoritos
CREATE POLICY "Usuarios pueden eliminar sus propios favoritos"
ON favoritos 
FOR DELETE 
TO authenticated 
USING (auth.uid()::text = user_id);

-- Comentarios
COMMENT ON TABLE favoritos IS 'Favoritos de usuarios. RLS habilitado para control de acceso.';









