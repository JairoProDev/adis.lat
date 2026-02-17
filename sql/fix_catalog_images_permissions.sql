-- ============================================================
-- ARREGLAR PERMISOS DE CATALOG-IMAGES
-- Ejecuta este script en el Editor SQL de Supabase para arreglar el error "new row violates row-level security policy"
-- ============================================================

-- 1. Asegurar que el bucket existe y es público
INSERT INTO storage.buckets (id, name, public) 
VALUES ('catalog-images', 'catalog-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Eliminar políticas antiguas para evitar conflictos
-- Nota: Usamos DO block para evitar errores si no existen
DO $$
BEGIN
    DROP POLICY IF EXISTS "Catalog Images Public View" ON storage.objects;
    DROP POLICY IF EXISTS "Catalog Images Auth Upload" ON storage.objects;
    DROP POLICY IF EXISTS "Catalog Images Auth Update" ON storage.objects;
    DROP POLICY IF EXISTS "Catalog Images Auth Delete" ON storage.objects;
    
    -- También intentar con nombres genericos que a veces se usan
    DROP POLICY IF EXISTS "Public Access" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- 3. Crear políticas correctas

-- Permite ver imágenes a todo el mundo (Público)
CREATE POLICY "Catalog Images Public View"
ON storage.objects FOR SELECT
USING ( bucket_id = 'catalog-images' );

-- Permite subir imágenes SOLO a tu propia carpeta (la carpeta debe llamarse igual que tu ID de usuario)
-- Esto coincide con la lógica de la app: userId/products/imagen.jpg
CREATE POLICY "Catalog Images Auth Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'catalog-images' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Permite actualizar tus propias imágenes
CREATE POLICY "Catalog Images Auth Update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'catalog-images' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Permite eliminar tus propias imágenes
CREATE POLICY "Catalog Images Auth Delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'catalog-images' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Asegurar que RLS está activo (por si acaso)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
