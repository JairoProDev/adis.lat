-- ============================================
-- TABLA Y CONFIGURACIÓN PARA AVISOS GRATUITOS
-- ============================================
-- Ejecuta esto en Supabase SQL Editor

-- Crear tabla para avisos gratuitos
CREATE TABLE IF NOT EXISTS avisos_gratuitos (
  id TEXT PRIMARY KEY,
  categoria TEXT NOT NULL CHECK (categoria IN ('empleos', 'inmuebles', 'vehiculos', 'servicios', 'productos', 'eventos', 'negocios', 'comunidad')),
  titulo TEXT NOT NULL CHECK (LENGTH(titulo) <= 30),
  contacto TEXT NOT NULL,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_expiracion TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índice para búsquedas rápidas de avisos activos
CREATE INDEX IF NOT EXISTS idx_avisos_gratuitos_activos 
ON avisos_gratuitos(fecha_expiracion) 
WHERE fecha_expiracion > NOW();

-- Crear índice por categoría
CREATE INDEX IF NOT EXISTS idx_avisos_gratuitos_categoria 
ON avisos_gratuitos(categoria);

-- Habilitar Row Level Security
ALTER TABLE avisos_gratuitos ENABLE ROW LEVEL SECURITY;

-- Política para que TODOS puedan LEER avisos gratuitos activos (no expirados)
CREATE POLICY "Todos pueden leer avisos gratuitos activos"
ON avisos_gratuitos 
FOR SELECT 
TO public 
USING (fecha_expiracion > NOW());

-- Política para que TODOS puedan CREAR avisos gratuitos
CREATE POLICY "Todos pueden crear avisos gratuitos"
ON avisos_gratuitos 
FOR INSERT 
TO public 
WITH CHECK (true);

-- Función para limpiar avisos expirados automáticamente
-- Esta función se puede ejecutar periódicamente con un cron job
CREATE OR REPLACE FUNCTION limpiar_avisos_gratuitos_expirados()
RETURNS INTEGER AS $$
DECLARE
  eliminados INTEGER;
BEGIN
  DELETE FROM avisos_gratuitos 
  WHERE fecha_expiracion < NOW();
  
  GET DIAGNOSTICS eliminados = ROW_COUNT;
  RETURN eliminados;
END;
$$ LANGUAGE plpgsql;

-- Comentarios en la tabla
COMMENT ON TABLE avisos_gratuitos IS 'Avisos gratuitos que expiran después de 1 día. Solo visibles en desktop, no indexados en búsqueda, mapa o chatbot.';
COMMENT ON COLUMN avisos_gratuitos.titulo IS 'Título del aviso, máximo 30 caracteres';
COMMENT ON COLUMN avisos_gratuitos.fecha_expiracion IS 'Fecha de expiración del aviso (1 día después de fecha_creacion)';

