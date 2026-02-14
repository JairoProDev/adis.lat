-- ============================================================
-- SUPABASE STORAGE SETUP FOR CATALOG FILES
-- ============================================================

-- Crear bucket para archivos del catálogo
INSERT INTO storage.buckets (id, name, public)
VALUES ('catalog-files', 'catalog-files', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage
-- 1. Usuarios autenticados pueden subir archivos
CREATE POLICY "Usuarios pueden subir archivos del catálogo"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'catalog-files' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM business_profiles WHERE user_id = auth.uid()
  )
);

-- 2. Usuarios pueden ver sus propios archivos
CREATE POLICY "Usuarios pueden ver sus archivos del catálogo"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'catalog-files' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM business_profiles WHERE user_id = auth.uid()
  )
);

-- 3. Cualquiera puede ver archivos públicos (para productos publicados)
CREATE POLICY "Archivos públicos del catálogo son visibles"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'catalog-files');

-- 4. Usuarios pueden eliminar sus archivos
CREATE POLICY "Usuarios pueden eliminar sus archivos del catálogo"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'catalog-files' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM business_profiles WHERE user_id = auth.uid()
  )
);
