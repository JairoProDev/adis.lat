-- ============================================
-- TABLA Y CONFIGURACIÓN PARA ADISOS GRATUITOS
-- ============================================
-- Ejecuta esto en Supabase SQL Editor

-- Crear tabla para adisos gratuitos
CREATE TABLE IF NOT EXISTS adisos_gratuitos (
  id TEXT PRIMARY KEY,
  categoria TEXT NOT NULL CHECK (categoria IN ('empleos', 'inmuebles', 'vehiculos', 'servicios', 'productos', 'eventos', 'negocios', 'comunidad')),
  titulo TEXT NOT NULL CHECK (LENGTH(titulo) <= 30),
  contacto TEXT NOT NULL,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_expiracion TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índice para búsquedas rápidas de adisos activos
CREATE INDEX IF NOT EXISTS idx_adisos_gratuitos_activos 
ON adisos_gratuitos(fecha_expiracion) 
WHERE fecha_expiracion > NOW();

-- Crear índice por categoría
CREATE INDEX IF NOT EXISTS idx_adisos_gratuitos_categoria 
ON adisos_gratuitos(categoria);

-- Habilitar Row Level Security
ALTER TABLE adisos_gratuitos ENABLE ROW LEVEL SECURITY;

-- Política para que TODOS puedan LEER adisos gratuitos activos (no expirados)
CREATE POLICY "Todos pueden leer adisos gratuitos activos"
ON adisos_gratuitos 
FOR SELECT 
TO public 
USING (fecha_expiracion > NOW());

-- Política para que TODOS puedan CREAR adisos gratuitos
CREATE POLICY "Todos pueden crear adisos gratuitos"
ON adisos_gratuitos 
FOR INSERT 
TO public 
WITH CHECK (true);

-- Función para limpiar adisos expirados automáticamente
-- Esta función se puede ejecutar periódicamente con un cron job
CREATE OR REPLACE FUNCTION limpiar_adisos_gratuitos_expirados()
RETURNS INTEGER AS $$
DECLARE
  eliminados INTEGER;
BEGIN
  DELETE FROM adisos_gratuitos 
  WHERE fecha_expiracion < NOW();
  
  GET DIAGNOSTICS eliminados = ROW_COUNT;
  RETURN eliminados;
END;
$$ LANGUAGE plpgsql;

-- Comentarios en la tabla
COMMENT ON TABLE adisos_gratuitos IS 'Adisos gratuitos que expiran después de 1 día. Solo visibles en desktop, no indexados en búsqueda, mapa o chatbot.';
COMMENT ON COLUMN adisos_gratuitos.titulo IS 'Título del adiso, máximo 30 caracteres';
COMMENT ON COLUMN adisos_gratuitos.fecha_expiracion IS 'Fecha de expiración del adiso (1 día después de fecha_creacion)';

