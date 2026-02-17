-- ============================================
-- AGREGAR COLUMNA USER_ID A TABLA ADISOS
-- ============================================
-- Este script agrega la columna user_id a la tabla adisos
-- para poder filtrar los anuncios por usuario.

-- 1. Agregar columna user_id si no existe
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'adisos' AND column_name = 'user_id') THEN
        ALTER TABLE adisos ADD COLUMN user_id UUID REFERENCES auth.users(id);
        
        -- Crear índice para mejorar rendimiento de búsquedas por user_id
        CREATE INDEX idx_adisos_user_id ON adisos(user_id);
    END IF;
END $$;

-- 2. Actualizar políticas RLS para permitir que usuarios vean/editen sus propios anuncios
-- (Opcional, si las políticas existentes no cubren esto)

-- Eliminar políticas antiguas si existen y confictuan
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propios adisos" ON adisos;
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus propios adisos" ON adisos;

-- Política: Usuarios pueden actualizar sus propios adisos
CREATE POLICY "Usuarios pueden actualizar sus propios adisos"
ON adisos
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Política: Usuarios pueden eliminar sus propios adisos
CREATE POLICY "Usuarios pueden eliminar sus propios adisos"
ON adisos
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Nota: La política de INSERT ya suele permitir crear a todos, 
-- pero idealmente debería forzar que user_id sea el propio usuario.
-- Por ahora lo dejamos permisivo o asumimos que el backend/cliente envía el user_id correcto.
