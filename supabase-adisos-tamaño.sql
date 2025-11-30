-- ============================================
-- AGREGAR CAMPO TAMAÑO A LA TABLA ADISOS
-- ============================================
-- Ejecuta esto en Supabase SQL Editor para agregar el campo tamaño

-- Agregar columna tamaño si no existe
ALTER TABLE adisos 
ADD COLUMN IF NOT EXISTS tamaño TEXT DEFAULT 'miniatura';

-- Crear índice para mejorar búsquedas por tamaño
CREATE INDEX IF NOT EXISTS idx_adisos_tamaño ON adisos(tamaño);

-- Comentario en la columna
COMMENT ON COLUMN adisos.tamaño IS 'Tamaño del paquete: miniatura, pequeño, mediano, grande, gigante';

