-- ============================================
-- ELIMINAR TODOS LOS ADISOS
-- ============================================
-- IMPORTANTE: Hacer backup antes de ejecutar
-- Ejecuta esto en Supabase SQL Editor

-- Primero, verificar cuántos adisos hay actualmente
SELECT COUNT(*) as total_anuncios FROM adisos;

-- Verificar si hay dependencias en otras tablas antes de eliminar
-- (favoritos, intereses, datos_toon, etc.)

-- ============================================
-- PASO 1: Eliminar registros relacionados
-- ============================================

-- Eliminar favoritos relacionados (si existen)
DELETE FROM favoritos WHERE adiso_id IN (SELECT id FROM adisos);

-- Eliminar datos TOON relacionados (si existen)
-- Nota: Esta tabla tiene CASCADE DELETE, pero lo hacemos explícitamente por seguridad
DELETE FROM datos_toon_anuncios WHERE adiso_id IN (SELECT id FROM adisos);

-- Eliminar intereses en anuncios caducados (si existen)
DELETE FROM intereses_anuncios_caducados WHERE adiso_id IN (SELECT id FROM adisos);

-- Eliminar registros de user_analytics que referencian adisos
-- (buscar en el campo JSONB 'datos' donde adiso_id esté presente)
DELETE FROM user_analytics 
WHERE datos ? 'adisoId' 
   OR datos->>'adisoId' IN (SELECT id::text FROM adisos);

-- ============================================
-- PASO 2: Eliminar todos los adisos
-- ============================================

DELETE FROM adisos;

-- ============================================
-- PASO 3: Verificar que se eliminaron
-- ============================================

SELECT COUNT(*) as anuncios_restantes FROM adisos;
SELECT COUNT(*) as favoritos_restantes FROM favoritos;
SELECT COUNT(*) as datos_toon_restantes FROM datos_toon_anuncios;
SELECT COUNT(*) as intereses_restantes FROM intereses_anuncios_caducados;

-- ============================================
-- NOTAS:
-- ============================================
-- - Los adisos_gratuitos NO se eliminan con este script
--   Si quieres eliminarlos también, ejecuta:
--   DELETE FROM adisos_gratuitos;
--
-- - Las imágenes en Supabase Storage NO se eliminan automáticamente
--   Si quieres limpiar el storage, hazlo manualmente desde el dashboard

