-- ============================================
-- MIGRACIÓN: SISTEMA DE ANUNCIOS HISTÓRICOS
-- ============================================
-- Ejecuta esto en Supabase SQL Editor
-- Este script agrega campos y tablas necesarias para el sistema de anuncios históricos

-- ============================================
-- MODIFICACIONES A TABLA ADISOS
-- ============================================

-- Agregar nuevos campos a la tabla adisos
ALTER TABLE adisos 
ADD COLUMN IF NOT EXISTS fecha_expiracion TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS esta_activo BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS es_historico BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS fuente_original TEXT,
ADD COLUMN IF NOT EXISTS edicion_numero TEXT,
ADD COLUMN IF NOT EXISTS fecha_publicacion_original DATE,
ADD COLUMN IF NOT EXISTS contactos_multiples JSONB DEFAULT '[]'::jsonb;

-- Comentarios en las nuevas columnas
COMMENT ON COLUMN adisos.fecha_expiracion IS 'Fecha de expiración del anuncio. Si es NULL, el anuncio no expira.';
COMMENT ON COLUMN adisos.esta_activo IS 'Indica si el anuncio está activo (true) o inactivo/caducado (false)';
COMMENT ON COLUMN adisos.es_historico IS 'Indica si el anuncio es histórico (extraído de PDFs antiguos)';
COMMENT ON COLUMN adisos.fuente_original IS 'Origen del anuncio: rueda_negocios, usuario, otro';
COMMENT ON COLUMN adisos.edicion_numero IS 'Número de edición de la revista (para anuncios de Rueda de Negocios)';
COMMENT ON COLUMN adisos.fecha_publicacion_original IS 'Fecha original de publicación en la revista';
COMMENT ON COLUMN adisos.contactos_multiples IS 'Array JSON de contactos: [{tipo: "telefono|whatsapp|email", valor: "...", principal: boolean}]';

-- ============================================
-- ÍNDICES DE OPTIMIZACIÓN
-- ============================================

-- Índice para filtrar anuncios activos
CREATE INDEX IF NOT EXISTS idx_adisos_activos 
ON adisos(esta_activo, fecha_expiracion) 
WHERE esta_activo = true;

-- Índice para búsquedas históricas
CREATE INDEX IF NOT EXISTS idx_adisos_historicos 
ON adisos(es_historico) 
WHERE es_historico = true;

-- Índice compuesto para ordenamiento por fecha de publicación
CREATE INDEX IF NOT EXISTS idx_adisos_fecha_publicacion 
ON adisos(fecha_publicacion DESC, hora_publicacion DESC);

-- Índice para filtrar por fuente
CREATE INDEX IF NOT EXISTS idx_adisos_fuente 
ON adisos(fuente_original) 
WHERE fuente_original IS NOT NULL;

-- Índice para búsquedas por fecha de expiración
CREATE INDEX IF NOT EXISTS idx_adisos_fecha_expiracion 
ON adisos(fecha_expiracion) 
WHERE fecha_expiracion IS NOT NULL;

-- Índice GIN para búsquedas en contactos_multiples
CREATE INDEX IF NOT EXISTS idx_adisos_contactos_multiples 
ON adisos USING GIN (contactos_multiples);

-- ============================================
-- TABLA: INTERESES EN ANUNCIOS CADUCADOS
-- ============================================

CREATE TABLE IF NOT EXISTS intereses_anuncios_caducados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adiso_id TEXT NOT NULL,
  usuario_id TEXT,
  contacto_usuario TEXT NOT NULL,
  mensaje TEXT,
  fecha_interes TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notificado_anunciante BOOLEAN DEFAULT false,
  fecha_notificacion TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Foreign key constraint (si la tabla adisos tiene restricciones)
  CONSTRAINT fk_adiso_interes FOREIGN KEY (adiso_id) 
    REFERENCES adisos(id) ON DELETE CASCADE
);

-- Índices para la tabla de intereses
CREATE INDEX IF NOT EXISTS idx_intereses_adiso 
ON intereses_anuncios_caducados(adiso_id);

CREATE INDEX IF NOT EXISTS idx_intereses_notificado 
ON intereses_anuncios_caducados(notificado_anunciante, fecha_interes);

CREATE INDEX IF NOT EXISTS idx_intereses_fecha 
ON intereses_anuncios_caducados(fecha_interes DESC);

-- Comentarios
COMMENT ON TABLE intereses_anuncios_caducados IS 'Registra intereses de usuarios en anuncios caducados para notificar a anunciantes';
COMMENT ON COLUMN intereses_anuncios_caducados.adiso_id IS 'ID del anuncio caducado';
COMMENT ON COLUMN intereses_anuncios_caducados.usuario_id IS 'ID del usuario (si está autenticado)';
COMMENT ON COLUMN intereses_anuncios_caducados.contacto_usuario IS 'Contacto del interesado (teléfono, email, etc.)';
COMMENT ON COLUMN intereses_anuncios_caducados.notificado_anunciante IS 'Indica si ya se notificó al anunciante sobre este interés';

-- Habilitar Row Level Security
ALTER TABLE intereses_anuncios_caducados ENABLE ROW LEVEL SECURITY;

-- Política: Todos pueden crear intereses
CREATE POLICY "Todos pueden crear intereses"
ON intereses_anuncios_caducados 
FOR INSERT 
TO public 
WITH CHECK (true);

-- Política: Solo el sistema puede leer intereses (para notificaciones)
-- Los usuarios no necesitan leer esta tabla directamente
CREATE POLICY "Solo sistema puede leer intereses"
ON intereses_anuncios_caducados 
FOR SELECT 
TO authenticated 
USING (true);

-- ============================================
-- TABLA: DATOS TOON PARA BÚSQUEDAS IA
-- ============================================

CREATE TABLE IF NOT EXISTS datos_toon_anuncios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adiso_id TEXT NOT NULL UNIQUE,
  contenido_toon TEXT NOT NULL,
  fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Foreign key constraint
  CONSTRAINT fk_adiso_toon FOREIGN KEY (adiso_id) 
    REFERENCES adisos(id) ON DELETE CASCADE
);

-- Índice GIN para búsquedas full-text en contenido TOON
-- Requiere extensión pg_trgm para búsquedas similares
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_toon_contenido_gin 
ON datos_toon_anuncios USING GIN (contenido_toon gin_trgm_ops);

-- Índice adicional para búsquedas por adiso_id
CREATE INDEX IF NOT EXISTS idx_toon_adiso_id 
ON datos_toon_anuncios(adiso_id);

-- Comentarios
COMMENT ON TABLE datos_toon_anuncios IS 'Almacena versión TOON (Token Oriented Object Notation) de cada anuncio para búsquedas semánticas del chatbot';
COMMENT ON COLUMN datos_toon_anuncios.contenido_toon IS 'Contenido en formato TOON optimizado para búsquedas semánticas';

-- Habilitar Row Level Security
ALTER TABLE datos_toon_anuncios ENABLE ROW LEVEL SECURITY;

-- Política: Todos pueden leer datos TOON (necesario para búsquedas)
CREATE POLICY "Todos pueden leer datos TOON"
ON datos_toon_anuncios 
FOR SELECT 
TO public 
USING (true);

-- Política: Solo sistema puede insertar/actualizar datos TOON
CREATE POLICY "Solo sistema puede modificar datos TOON"
ON datos_toon_anuncios 
FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);

-- ============================================
-- TABLA: API KEYS (para autenticación de API externa)
-- ============================================

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_hash TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  activa BOOLEAN DEFAULT true,
  rate_limit_per_hour INTEGER DEFAULT 1000,
  permisos TEXT[] DEFAULT ARRAY['read']::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_api_keys_hash 
ON api_keys(key_hash) 
WHERE activa = true;

CREATE INDEX IF NOT EXISTS idx_api_keys_activa 
ON api_keys(activa) 
WHERE activa = true;

-- Comentarios
COMMENT ON TABLE api_keys IS 'Almacena API keys para autenticación de la API externa';
COMMENT ON COLUMN api_keys.key_hash IS 'Hash de la API key (nunca almacenar la key en texto plano)';
COMMENT ON COLUMN api_keys.rate_limit_per_hour IS 'Límite de requests por hora';

-- Habilitar Row Level Security
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Política: Solo admins pueden ver API keys
CREATE POLICY "Solo admins pueden ver API keys"
ON api_keys 
FOR SELECT 
TO authenticated 
USING (true); -- Ajustar según tu sistema de roles

-- ============================================
-- FUNCIONES AUXILIARES
-- ============================================

-- Función para obtener intereses no notificados agrupados por anuncio
CREATE OR REPLACE FUNCTION obtener_intereses_por_notificar(
  minimo_intereses INTEGER DEFAULT 3
)
RETURNS TABLE (
  adiso_id TEXT,
  total_intereses BIGINT,
  ultimo_interes TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.adiso_id,
    COUNT(*)::BIGINT as total_intereses,
    MAX(i.fecha_interes) as ultimo_interes
  FROM intereses_anuncios_caducados i
  WHERE i.notificado_anunciante = false
  GROUP BY i.adiso_id
  HAVING COUNT(*) >= minimo_intereses
  ORDER BY total_intereses DESC, ultimo_interes DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para marcar intereses como notificados
CREATE OR REPLACE FUNCTION marcar_intereses_notificados(
  p_adiso_id TEXT,
  p_fecha_notificacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS INTEGER AS $$
DECLARE
  actualizados INTEGER;
BEGIN
  UPDATE intereses_anuncios_caducados
  SET notificado_anunciante = true,
      fecha_notificacion = p_fecha_notificacion
  WHERE adiso_id = p_adiso_id
    AND notificado_anunciante = false;
  
  GET DIAGNOSTICS actualizados = ROW_COUNT;
  RETURN actualizados;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ACTUALIZAR VALORES POR DEFECTO
-- ============================================

-- Marcar todos los anuncios existentes como activos (si no tienen fecha_expiracion)
UPDATE adisos 
SET esta_activo = true 
WHERE esta_activo IS NULL;

-- Marcar todos los anuncios existentes como no históricos
UPDATE adisos 
SET es_historico = false 
WHERE es_historico IS NULL;

-- Inicializar contactos_multiples como array vacío si es NULL
UPDATE adisos 
SET contactos_multiples = '[]'::jsonb 
WHERE contactos_multiples IS NULL;

-- ============================================
-- VERIFICACIONES FINALES
-- ============================================

-- Verificar que las columnas se crearon correctamente
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'adisos' 
--   AND column_name IN ('fecha_expiracion', 'esta_activo', 'es_historico', 'fuente_original', 'edicion_numero', 'fecha_publicacion_original', 'contactos_multiples');

-- Verificar que las tablas se crearon
-- SELECT table_name 
-- FROM information_schema.tables 
-- WHERE table_schema = 'public' 
--   AND table_name IN ('intereses_anuncios_caducados', 'datos_toon_anuncios', 'api_keys');

