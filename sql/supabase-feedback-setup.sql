-- ============================================
-- CONFIGURACIÓN DE TABLA DE FEEDBACK
-- ============================================
-- Copia y pega esto COMPLETO en Supabase SQL Editor
-- Solo necesitas hacerlo UNA VEZ

-- Crear tabla de feedback
CREATE TABLE IF NOT EXISTS feedback (
  id TEXT PRIMARY KEY,
  tipo TEXT NOT NULL CHECK (tipo IN ('sugerencia', 'problema')),
  texto TEXT NOT NULL,
  fecha TEXT NOT NULL,
  hora TEXT NOT NULL,
  url TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  leido BOOLEAN DEFAULT FALSE
);

-- Habilitar Row Level Security
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Política para que TODOS puedan CREAR feedback (pero no leer)
CREATE POLICY "Todos pueden crear feedback"
ON feedback 
FOR INSERT 
TO public 
WITH CHECK (true);

-- Política para que solo usuarios autenticados puedan leer (opcional)
-- Por ahora, deshabilitamos la lectura pública por seguridad
-- Si quieres ver los feedbacks desde el dashboard de Supabase, puedes hacerlo directamente

-- Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_feedback_tipo ON feedback(tipo);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_feedback_leido ON feedback(leido);

