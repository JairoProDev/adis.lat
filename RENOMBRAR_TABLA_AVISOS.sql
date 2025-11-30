-- ============================================
-- RENOMBRAR TABLA DE AVISOS A ADISOS EN SUPABASE
-- ============================================
-- ⚠️ IMPORTANTE: Ejecuta esto en Supabase SQL Editor
-- Este script renombra la tabla "avisos" a "adisos" para mantener consistencia con el branding

-- PASO 1: Verificar si la tabla "avisos" existe
-- (Si no existe, tu tabla ya se llama "adisos" y no necesitas hacer nada)
-- Puedes verificar con:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' AND table_name IN ('avisos', 'adisos');

-- PASO 2: Si la tabla se llama "avisos", ejecuta esto para renombrarla:

-- Primero, eliminar políticas RLS antiguas de la tabla "avisos" (antes de renombrar)
DROP POLICY IF EXISTS "Todos pueden leer avisos" ON avisos;
DROP POLICY IF EXISTS "Todos pueden crear avisos" ON avisos;
DROP POLICY IF EXISTS "Todos pueden actualizar avisos" ON avisos;
DROP POLICY IF EXISTS "Todos pueden eliminar avisos" ON avisos;
DROP POLICY IF EXISTS "Todos pueden leer adisos" ON avisos;
DROP POLICY IF EXISTS "Todos pueden crear adisos" ON avisos;

-- Renombrar la tabla principal (esto también renombrará automáticamente índices y constraints)
ALTER TABLE IF EXISTS avisos RENAME TO adisos;

-- Renombrar índices si existen (esto también se renombra automáticamente en PostgreSQL)
-- Pero por si acaso, verificamos y creamos los necesarios
CREATE INDEX IF NOT EXISTS idx_adisos_tamaño ON adisos(tamaño);
CREATE INDEX IF NOT EXISTS idx_adisos_categoria ON adisos(categoria);
CREATE INDEX IF NOT EXISTS idx_adisos_fecha_publicacion ON adisos(fecha_publicacion);

-- Recrear políticas RLS con los nombres correctos
ALTER TABLE adisos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos pueden leer adisos"
ON adisos 
FOR SELECT 
TO public 
USING (true);

CREATE POLICY "Todos pueden crear adisos"
ON adisos 
FOR INSERT 
TO public 
WITH CHECK (true);

-- Si necesitas políticas de UPDATE, descomenta y ajusta:
-- CREATE POLICY "Todos pueden actualizar adisos"
-- ON adisos 
-- FOR UPDATE 
-- TO public 
-- USING (true);

-- PASO 3: Verificar que todo esté correcto
-- Ejecuta esto para ver las tablas:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%adiso%';
