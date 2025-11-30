-- ============================================
-- CONFIGURACIÓN INICIAL DE SUPABASE PARA ADISOS
-- ============================================
-- Copia y pega esto COMPLETO en Supabase SQL Editor
-- Solo necesitas hacerlo UNA VEZ

-- Habilitar Row Level Security
ALTER TABLE adisos ENABLE ROW LEVEL SECURITY;

-- Política para que TODOS puedan LEER adisos
CREATE POLICY "Todos pueden leer adisos"
ON adisos 
FOR SELECT 
TO public 
USING (true);

-- Política para que TODOS puedan CREAR adisos
CREATE POLICY "Todos pueden crear adisos"
ON adisos 
FOR INSERT 
TO public 
WITH CHECK (true);

