-- ============================================
-- MIGRACIÓN COMPLETA: DE "AVISO" A "ADISO"
-- ============================================
-- ⚠️ IMPORTANTE: Ejecuta esto en Supabase SQL Editor
-- Este script renombra TODO de "aviso" a "adiso" en Supabase

-- ============================================
-- PASO 1: ELIMINAR TODOS LOS DATOS (OPCIONAL)
-- ============================================
-- Si quieres empezar desde cero, descomenta estas líneas:

-- TRUNCATE TABLE avisos CASCADE;
-- TRUNCATE TABLE avisos_gratuitos CASCADE;

-- ============================================
-- PASO 2: RENOMBRAR TABLA PRINCIPAL "avisos" → "adisos"
-- ============================================

-- Eliminar políticas RLS antiguas de "avisos"
DROP POLICY IF EXISTS "Todos pueden leer avisos" ON avisos;
DROP POLICY IF EXISTS "Todos pueden crear avisos" ON avisos;
DROP POLICY IF EXISTS "Todos pueden actualizar avisos" ON avisos;
DROP POLICY IF EXISTS "Todos pueden eliminar avisos" ON avisos;

-- Renombrar la tabla
ALTER TABLE IF EXISTS avisos RENAME TO adisos;

-- Recrear políticas RLS con nombres correctos
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

-- ============================================
-- PASO 3: RENOMBRAR ÍNDICES
-- ============================================

-- Eliminar índices antiguos
DROP INDEX IF EXISTS idx_avisos_categoria;
DROP INDEX IF EXISTS idx_avisos_created_at;
DROP INDEX IF EXISTS idx_avisos_busqueda;
DROP INDEX IF EXISTS idx_avisos_tamaño;

-- Crear índices con nombres correctos
CREATE INDEX IF NOT EXISTS idx_adisos_categoria ON adisos(categoria);
CREATE INDEX IF NOT EXISTS idx_adisos_created_at ON adisos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_adisos_busqueda ON adisos USING GIN (to_tsvector('spanish', titulo || ' ' || descripcion || ' ' || ubicacion));
CREATE INDEX IF NOT EXISTS idx_adisos_tamaño ON adisos(tamaño);

-- ============================================
-- PASO 4: RENOMBRAR TABLA "avisos_gratuitos" → "adisos_gratuitos"
-- ============================================

-- Eliminar políticas antiguas
DROP POLICY IF EXISTS "Todos pueden leer avisos gratuitos activos" ON avisos_gratuitos;
DROP POLICY IF EXISTS "Todos pueden crear avisos gratuitos" ON avisos_gratuitos;

-- Renombrar la tabla
ALTER TABLE IF EXISTS avisos_gratuitos RENAME TO adisos_gratuitos;

-- Recrear políticas
ALTER TABLE adisos_gratuitos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos pueden leer adisos gratuitos activos"
ON adisos_gratuitos 
FOR SELECT 
TO public 
USING (fecha_expiracion > NOW());

CREATE POLICY "Todos pueden crear adisos gratuitos"
ON adisos_gratuitos 
FOR INSERT 
TO public 
WITH CHECK (true);

-- Renombrar índices
DROP INDEX IF EXISTS idx_avisos_gratuitos_activos;
DROP INDEX IF EXISTS idx_avisos_gratuitos_categoria;

CREATE INDEX IF NOT EXISTS idx_adisos_gratuitos_activos 
ON adisos_gratuitos(fecha_expiracion) 
WHERE fecha_expiracion > NOW();

CREATE INDEX IF NOT EXISTS idx_adisos_gratuitos_categoria 
ON adisos_gratuitos(categoria);

-- Renombrar función
DROP FUNCTION IF EXISTS limpiar_avisos_gratuitos_expirados();

CREATE OR REPLACE FUNCTION limpiar_adisos_gratuitos_expirados()
RETURNS INTEGER AS $$
DECLARE
  eliminados INTEGER;
BEGIN
  DELETE FROM adisos_gratuitos 
  WHERE fecha_expiracion < NOW();
  
  GET DIAGNOSTICS eliminados = ROW_COUNT;
  RETURN eliminados;
END;
$$ LANGUAGE plpgsql;

-- Actualizar comentarios
COMMENT ON TABLE adisos_gratuitos IS 'Adisos gratuitos que expiran después de 1 día. Solo visibles en desktop, no indexados en búsqueda, mapa o chatbot.';
COMMENT ON COLUMN adisos_gratuitos.titulo IS 'Título del adiso, máximo 30 caracteres';
COMMENT ON COLUMN adisos_gratuitos.fecha_expiracion IS 'Fecha de expiración del adiso (1 día después de fecha_creacion)';

-- ============================================
-- PASO 5: RENOMBRAR BUCKET DE STORAGE
-- ============================================
-- ⚠️ NOTA: Los buckets de Storage no se pueden renombrar directamente
-- Necesitas crear uno nuevo y migrar los archivos, o simplemente crear uno nuevo
-- Como vas a empezar desde cero, crearemos el bucket nuevo directamente

-- Eliminar bucket antiguo si existe (esto eliminará TODAS las imágenes)
-- ⚠️ CUIDADO: Esto eliminará todas las imágenes almacenadas
-- DELETE FROM storage.buckets WHERE id = 'avisos-images';

-- Crear bucket nuevo con nombre correcto
INSERT INTO storage.buckets (id, name, public)
VALUES ('adisos-images', 'adisos-images', true)
ON CONFLICT (id) DO NOTHING;

-- Eliminar políticas antiguas del bucket
DROP POLICY IF EXISTS "Permitir subir imágenes de avisos" ON storage.objects;
DROP POLICY IF EXISTS "Permitir leer imágenes de avisos" ON storage.objects;

-- Crear políticas nuevas para el bucket
CREATE POLICY "Permitir subir imágenes de adisos"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'adisos-images');

CREATE POLICY "Permitir leer imágenes de adisos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'adisos-images');

-- ============================================
-- PASO 6: VERIFICACIÓN
-- ============================================

-- Verificar tablas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%adiso%';

-- Verificar buckets
SELECT id, name, public 
FROM storage.buckets 
WHERE id LIKE '%adiso%';

-- Verificar políticas
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('adisos', 'adisos_gratuitos');

