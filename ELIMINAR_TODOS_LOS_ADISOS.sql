-- ============================================
-- ELIMINAR TODOS LOS ADISOS
-- ============================================
-- ⚠️ ATENCIÓN: Este script elimina TODOS los adisos y adisos gratuitos
-- Úsalo solo si quieres empezar desde cero
-- Ejecuta esto en Supabase SQL Editor

-- Eliminar todos los adisos
DELETE FROM avisos;
-- O si ya renombraste la tabla:
-- DELETE FROM adisos;

-- Eliminar todos los adisos gratuitos
DELETE FROM avisos_gratuitos;
-- O si ya renombraste la tabla:
-- DELETE FROM adisos_gratuitos;

-- Verificar que se eliminaron (debería mostrar 0)
SELECT COUNT(*) FROM avisos;
SELECT COUNT(*) FROM avisos_gratuitos;

-- Si también quieres eliminar las imágenes del storage:
-- ⚠️ CUIDADO: Esto eliminará TODAS las imágenes
-- DELETE FROM storage.objects WHERE bucket_id = 'avisos-images';
-- DELETE FROM storage.objects WHERE bucket_id = 'adisos-images';

