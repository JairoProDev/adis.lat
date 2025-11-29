-- ============================================
-- FIX: Permitir ver feedbacks desde el dashboard
-- ============================================
-- Ejecuta esto en Supabase SQL Editor si no puedes ver los feedbacks

-- Política para permitir lectura desde el dashboard (service_role bypass RLS automáticamente)
-- Esta política permite que el dashboard de Supabase vea los datos
-- Nota: El dashboard usa service_role que bypass RLS, pero por si acaso agregamos esta política

-- Si ya existe la política, la eliminamos primero
DROP POLICY IF EXISTS "Dashboard puede leer feedback" ON feedback;

-- Crear política para lectura (opcional, el dashboard normalmente bypass RLS)
CREATE POLICY "Dashboard puede leer feedback"
ON feedback 
FOR SELECT 
TO authenticated
USING (true);

-- También permitir lectura pública para debugging (puedes eliminarla después)
-- IMPORTANTE: Esto es solo para verificar que funciona, luego deberías eliminarla
DROP POLICY IF EXISTS "Public puede leer feedback temporal" ON feedback;

CREATE POLICY "Public puede leer feedback temporal"
ON feedback 
FOR SELECT 
TO public
USING (true);

-- Verificar que las políticas estén activas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'feedback';

