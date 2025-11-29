-- ============================================
-- AGREGAR CAMPO TAMAÑO A LA TABLA AVISOS
-- ============================================
-- Ejecuta esto en Supabase SQL Editor para agregar el campo tamaño

-- Agregar columna tamaño si no existe
ALTER TABLE avisos 
ADD COLUMN IF NOT EXISTS tamaño TEXT DEFAULT 'miniatura';

-- Crear índice para mejorar búsquedas por tamaño
CREATE INDEX IF NOT EXISTS idx_avisos_tamaño ON avisos(tamaño);

-- Comentario en la columna
COMMENT ON COLUMN avisos.tamaño IS 'Tamaño del paquete: miniatura, pequeño, mediano, grande, gigante';

