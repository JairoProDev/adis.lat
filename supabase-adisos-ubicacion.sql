-- ============================================
-- AGREGAR CAMPOS DE UBICACIÓN DETALLADA A ADISOS
-- ============================================
-- Ejecuta esto en Supabase SQL Editor para agregar campos de ubicación detallada

-- Agregar columnas de ubicación si no existen
ALTER TABLE adisos 
ADD COLUMN IF NOT EXISTS pais TEXT DEFAULT 'Perú',
ADD COLUMN IF NOT EXISTS departamento TEXT,
ADD COLUMN IF NOT EXISTS provincia TEXT,
ADD COLUMN IF NOT EXISTS distrito TEXT,
ADD COLUMN IF NOT EXISTS direccion TEXT,
ADD COLUMN IF NOT EXISTS latitud DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitud DOUBLE PRECISION;

-- Crear índices para búsquedas rápidas por ubicación
CREATE INDEX IF NOT EXISTS idx_adisos_departamento ON adisos(departamento);
CREATE INDEX IF NOT EXISTS idx_adisos_provincia ON adisos(provincia);
CREATE INDEX IF NOT EXISTS idx_adisos_distrito ON adisos(distrito);

-- Crear índice espacial para búsquedas por proximidad (usando PostGIS si está disponible)
-- Si no tienes PostGIS, puedes usar una función de distancia simple
CREATE INDEX IF NOT EXISTS idx_adisos_coordenadas ON adisos(latitud, longitud) 
WHERE latitud IS NOT NULL AND longitud IS NOT NULL;

-- Función para calcular distancia aproximada entre dos puntos (Haversine)
-- Útil para búsquedas por proximidad
CREATE OR REPLACE FUNCTION calcular_distancia_km(
  lat1 DOUBLE PRECISION,
  lon1 DOUBLE PRECISION,
  lat2 DOUBLE PRECISION,
  lon2 DOUBLE PRECISION
)
RETURNS DOUBLE PRECISION AS $$
DECLARE
  R DOUBLE PRECISION := 6371; -- Radio de la Tierra en km
  dlat DOUBLE PRECISION;
  dlon DOUBLE PRECISION;
  a DOUBLE PRECISION;
  c DOUBLE PRECISION;
BEGIN
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  
  a := sin(dlat/2) * sin(dlat/2) +
       cos(radians(lat1)) * cos(radians(lat2)) *
       sin(dlon/2) * sin(dlon/2);
  
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  
  RETURN R * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Función para buscar adisos cercanos a una ubicación
CREATE OR REPLACE FUNCTION buscar_adisos_cercanos(
  lat_busqueda DOUBLE PRECISION,
  lon_busqueda DOUBLE PRECISION,
  radio_km DOUBLE PRECISION DEFAULT 10,
  limite_resultados INTEGER DEFAULT 50
)
RETURNS TABLE (
  id TEXT,
  categoria TEXT,
  titulo TEXT,
  distancia_km DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.categoria,
    a.titulo,
    calcular_distancia_km(lat_busqueda, lon_busqueda, a.latitud, a.longitud) AS distancia_km
  FROM adisos a
  WHERE a.latitud IS NOT NULL 
    AND a.longitud IS NOT NULL
    AND calcular_distancia_km(lat_busqueda, lon_busqueda, a.latitud, a.longitud) <= radio_km
  ORDER BY distancia_km ASC
  LIMIT limite_resultados;
END;
$$ LANGUAGE plpgsql;

-- Comentarios en las columnas
COMMENT ON COLUMN adisos.pais IS 'País del adiso (por defecto: Perú)';
COMMENT ON COLUMN adisos.departamento IS 'Departamento del adiso';
COMMENT ON COLUMN adisos.provincia IS 'Provincia del adiso';
COMMENT ON COLUMN adisos.distrito IS 'Distrito del adiso';
COMMENT ON COLUMN adisos.direccion IS 'Dirección específica del adiso (opcional)';
COMMENT ON COLUMN adisos.latitud IS 'Coordenada de latitud para ubicación en mapa';
COMMENT ON COLUMN adisos.longitud IS 'Coordenada de longitud para ubicación en mapa';

-- Nota: La columna 'ubicacion' (texto) se mantiene para compatibilidad hacia atrás
-- Los nuevos adisos deberían usar los campos detallados (departamento, provincia, distrito, etc.)

