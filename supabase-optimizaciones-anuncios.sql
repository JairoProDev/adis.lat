-- ============================================
-- OPTIMIZACIONES DE BASE DE DATOS PARA ANUNCIOS
-- ============================================
-- Ejecuta esto en Supabase SQL Editor después de las migraciones básicas
-- Este script optimiza índices, agrega búsqueda full-text y evalúa campos

-- ============================================
-- ÍNDICES OPTIMIZADOS
-- ============================================

-- Índice compuesto geográfico para búsquedas por ubicación
CREATE INDEX IF NOT EXISTS idx_adisos_geografico 
ON adisos(departamento, provincia, distrito) 
WHERE departamento IS NOT NULL AND provincia IS NOT NULL AND distrito IS NOT NULL;

-- Índice parcial para anuncios activos (más común en consultas)
CREATE INDEX IF NOT EXISTS idx_adisos_activos_optimizado 
ON adisos(esta_activo, fecha_publicacion DESC, categoria) 
WHERE esta_activo = true;

-- Índice para búsquedas por fecha de publicación (activos e históricos)
CREATE INDEX IF NOT EXISTS idx_adisos_fecha_publicacion_optimizado 
ON adisos(fecha_publicacion DESC, hora_publicacion DESC, esta_activo);

-- Índice para búsquedas por categoría y estado
CREATE INDEX IF NOT EXISTS idx_adisos_categoria_activo 
ON adisos(categoria, esta_activo, fecha_publicacion DESC);

-- Índice para búsquedas por tamaño (útil para filtros)
CREATE INDEX IF NOT EXISTS idx_adisos_tamaño 
ON adisos(tamaño) 
WHERE tamaño IS NOT NULL;

-- Índice para búsquedas por fuente original
CREATE INDEX IF NOT EXISTS idx_adisos_fuente_original 
ON adisos(fuente_original) 
WHERE fuente_original IS NOT NULL;

-- Índice para búsquedas por edición (para anuncios históricos)
CREATE INDEX IF NOT EXISTS idx_adisos_edicion 
ON adisos(edicion_numero) 
WHERE edicion_numero IS NOT NULL;

-- ============================================
-- BÚSQUEDA FULL-TEXT
-- ============================================

-- Agregar columna para búsqueda full-text (TSVECTOR)
ALTER TABLE adisos 
ADD COLUMN IF NOT EXISTS texto_busqueda TSVECTOR;

-- Función para actualizar texto_busqueda automáticamente
CREATE OR REPLACE FUNCTION actualizar_texto_busqueda() 
RETURNS TRIGGER AS $$
BEGIN
  NEW.texto_busqueda := 
    setweight(to_tsvector('spanish', COALESCE(NEW.titulo, '')), 'A') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.descripcion, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar texto_busqueda automáticamente
DROP TRIGGER IF EXISTS trigger_actualizar_texto_busqueda ON adisos;
CREATE TRIGGER trigger_actualizar_texto_busqueda
BEFORE INSERT OR UPDATE ON adisos
FOR EACH ROW
EXECUTE FUNCTION actualizar_texto_busqueda();

-- Índice GIN para búsquedas full-text rápidas
CREATE INDEX IF NOT EXISTS idx_adisos_texto_busqueda_gin 
ON adisos USING GIN (texto_busqueda);

-- Actualizar texto_busqueda para registros existentes
UPDATE adisos 
SET texto_busqueda = 
  setweight(to_tsvector('spanish', COALESCE(titulo, '')), 'A') ||
  setweight(to_tsvector('spanish', COALESCE(descripcion, '')), 'B')
WHERE texto_busqueda IS NULL;

-- ============================================
-- OPTIMIZACIONES DE CAMPOS
-- ============================================

-- Establecer DEFAULT para fuente_original (todos los nuevos serán 'usuario' por defecto)
-- Los históricos se marcarán explícitamente como 'rueda_negocios'
ALTER TABLE adisos 
ALTER COLUMN fuente_original SET DEFAULT 'usuario';

-- Comentarios en campos optimizados
COMMENT ON COLUMN adisos.texto_busqueda IS 'Campo TSVECTOR para búsquedas full-text optimizadas en título y descripción';
COMMENT ON COLUMN adisos.fuente_original IS 'Origen del anuncio: usuario (default), rueda_negocios (históricos), otro';

-- ============================================
-- FUNCIONES DE BÚSQUEDA OPTIMIZADAS
-- ============================================

-- Función para búsqueda full-text en anuncios
CREATE OR REPLACE FUNCTION buscar_adisos_texto(
  p_termino TEXT,
  p_limite INTEGER DEFAULT 50,
  p_solo_activos BOOLEAN DEFAULT true
)
RETURNS TABLE (
  id TEXT,
  titulo TEXT,
  descripcion TEXT,
  categoria TEXT,
  relevancia REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.titulo,
    a.descripcion,
    a.categoria,
    ts_rank(a.texto_busqueda, plainto_tsquery('spanish', p_termino))::REAL as relevancia
  FROM adisos a
  WHERE a.texto_busqueda @@ plainto_tsquery('spanish', p_termino)
    AND (NOT p_solo_activos OR a.esta_activo = true)
  ORDER BY relevancia DESC, a.fecha_publicacion DESC
  LIMIT p_limite;
END;
$$ LANGUAGE plpgsql;

-- Función para buscar anuncios por ubicación y texto
CREATE OR REPLACE FUNCTION buscar_adisos_ubicacion_texto(
  p_termino TEXT,
  p_distrito TEXT DEFAULT NULL,
  p_provincia TEXT DEFAULT NULL,
  p_categoria TEXT DEFAULT NULL,
  p_limite INTEGER DEFAULT 50
)
RETURNS TABLE (
  id TEXT,
  titulo TEXT,
  categoria TEXT,
  distrito TEXT,
  relevancia REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.titulo,
    a.categoria,
    a.distrito,
    ts_rank(a.texto_busqueda, plainto_tsquery('spanish', p_termino))::REAL as relevancia
  FROM adisos a
  WHERE a.texto_busqueda @@ plainto_tsquery('spanish', p_termino)
    AND a.esta_activo = true
    AND (p_distrito IS NULL OR a.distrito = p_distrito)
    AND (p_provincia IS NULL OR a.provincia = p_provincia)
    AND (p_categoria IS NULL OR a.categoria = p_categoria)
  ORDER BY relevancia DESC, a.fecha_publicacion DESC
  LIMIT p_limite;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ESTADÍSTICAS Y ANÁLISIS
-- ============================================

-- Vista para estadísticas de anuncios por categoría
CREATE OR REPLACE VIEW vista_estadisticas_categorias AS
SELECT 
  categoria,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE esta_activo = true) as activos,
  COUNT(*) FILTER (WHERE esta_activo = false) as inactivos,
  COUNT(*) FILTER (WHERE es_historico = true) as historicos,
  COUNT(*) FILTER (WHERE es_historico = false) as nuevos
FROM adisos
GROUP BY categoria;

-- Vista para estadísticas por distrito
CREATE OR REPLACE VIEW vista_estadisticas_distritos AS
SELECT 
  distrito,
  provincia,
  COUNT(*) as total_anuncios,
  COUNT(*) FILTER (WHERE esta_activo = true) as anuncios_activos,
  COUNT(DISTINCT categoria) as categorias_diferentes
FROM adisos
WHERE distrito IS NOT NULL
GROUP BY distrito, provincia
ORDER BY total_anuncios DESC;

-- ============================================
-- LIMPIEZA Y MANTENIMIENTO
-- ============================================

-- Función para limpiar texto_busqueda de anuncios antiguos (opcional, para mantenimiento)
CREATE OR REPLACE FUNCTION limpiar_texto_busqueda_antiguos()
RETURNS INTEGER AS $$
DECLARE
  actualizados INTEGER;
BEGIN
  UPDATE adisos
  SET texto_busqueda = 
    setweight(to_tsvector('spanish', COALESCE(titulo, '')), 'A') ||
    setweight(to_tsvector('spanish', COALESCE(descripcion, '')), 'B')
  WHERE texto_busqueda IS NULL
    AND (titulo IS NOT NULL OR descripcion IS NOT NULL);
  
  GET DIAGNOSTICS actualizados = ROW_COUNT;
  RETURN actualizados;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VERIFICACIONES
-- ============================================

-- Verificar que los índices se crearon correctamente
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename = 'adisos' 
-- ORDER BY indexname;

-- Verificar estadísticas de uso de índices (ejecutar después de cargar datos)
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
-- FROM pg_stat_user_indexes
-- WHERE tablename = 'adisos'
-- ORDER BY idx_scan DESC;









