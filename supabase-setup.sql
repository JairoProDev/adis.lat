-- ============================================
-- CONFIGURACIÓN INICIAL DE SUPABASE
-- ============================================
-- Copia y pega esto COMPLETO en Supabase SQL Editor
-- Solo necesitas hacerlo UNA VEZ

-- Habilitar Row Level Security
ALTER TABLE avisos ENABLE ROW LEVEL SECURITY;

-- Política para que TODOS puedan LEER avisos
CREATE POLICY "Todos pueden leer avisos"
ON avisos 
FOR SELECT 
TO public 
USING (true);

-- Política para que TODOS puedan CREAR avisos
CREATE POLICY "Todos pueden crear avisos"
ON avisos 
FOR INSERT 
TO public 
WITH CHECK (true);

