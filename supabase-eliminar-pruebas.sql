-- ============================================
-- ELIMINAR ANUNCIOS DE PRUEBA
-- ============================================
-- Este script elimina los 29 anuncios de prueba que se crearon durante el desarrollo
-- IMPORTANTE: Hacer backup antes de ejecutar
-- Ejecuta esto en Supabase SQL Editor

-- Primero, verificar cuántos anuncios hay actualmente
-- SELECT COUNT(*) as total_anuncios FROM adisos;

-- Verificar si hay dependencias en otras tablas antes de eliminar
-- (analytics, favoritos, intereses, etc.)

-- Eliminar registros relacionados en analytics (si existen)
-- DELETE FROM analytics WHERE adiso_id IN (SELECT id FROM adisos WHERE created_at < NOW() - INTERVAL '30 days');

-- Eliminar favoritos relacionados (si existen)
-- DELETE FROM favoritos WHERE adiso_id IN (SELECT id FROM adisos WHERE created_at < NOW() - INTERVAL '30 days');

-- Eliminar todos los anuncios (los 29 de prueba)
-- Como son de prueba y recientes, eliminamos todos los creados antes de hoy
-- Ajusta la fecha según necesites
DELETE FROM adisos 
WHERE created_at < NOW() - INTERVAL '1 day'
   OR (created_at >= NOW() - INTERVAL '1 day' AND created_at < NOW());

-- Verificar que se eliminaron
-- SELECT COUNT(*) as anuncios_restantes FROM adisos;

-- Si necesitas eliminar solo los primeros 29 (más seguro):
-- DELETE FROM adisos WHERE id IN (
--   SELECT id FROM adisos 
--   ORDER BY created_at ASC 
--   LIMIT 29
-- );



