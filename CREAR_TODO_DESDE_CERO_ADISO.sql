-- ============================================
-- CREAR TODO DESDE CERO CON NOMBRES "ADISO"
-- ============================================
-- ⚠️ IMPORTANTE: Ejecuta esto en Supabase SQL Editor
-- Este script crea todas las tablas, índices, políticas y buckets
-- con los nombres correctos usando "adiso" en lugar de "aviso"
-- Úsalo si prefieres crear todo desde cero en lugar de renombrar

-- ============================================
-- PASO 1: CREAR TABLA PRINCIPAL "adisos"
-- ============================================

CREATE TABLE IF NOT EXISTS adisos (
  id TEXT PRIMARY KEY,
  categoria TEXT NOT NULL,
  titulo TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  contacto TEXT NOT NULL,
  ubicacion TEXT NOT NULL,
  fecha_publicacion DATE NOT NULL,
  hora_publicacion TIME NOT NULL,
  imagen_url TEXT,
  imagenes_urls TEXT,
  tamaño TEXT DEFAULT 'miniatura',
  es_gratuito BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_adisos_categoria ON adisos(categoria);
CREATE INDEX IF NOT EXISTS idx_adisos_created_at ON adisos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_adisos_busqueda ON adisos USING GIN (to_tsvector('spanish', titulo || ' ' || descripcion || ' ' || ubicacion));
CREATE INDEX IF NOT EXISTS idx_adisos_tamaño ON adisos(tamaño);

-- Habilitar Row Level Security
ALTER TABLE adisos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Todos pueden leer adisos"
ON adisos 
FOR SELECT 
TO public 
USING (true);

CREATE POLICY "Todos pueden crear adisos"
ON adisos 
FOR INSERT 
TO public 
WITH CHECK (true);

-- Comentarios
COMMENT ON TABLE adisos IS 'Tabla principal de adisos (anuncios clasificados)';
COMMENT ON COLUMN adisos.tamaño IS 'Tamaño del paquete: miniatura, pequeño, mediano, grande, gigante';

-- ============================================
-- PASO 2: CREAR TABLA "adisos_gratuitos"
-- ============================================

CREATE TABLE IF NOT EXISTS adisos_gratuitos (
  id TEXT PRIMARY KEY,
  categoria TEXT NOT NULL CHECK (categoria IN ('empleos', 'inmuebles', 'vehiculos', 'servicios', 'productos', 'eventos', 'negocios', 'comunidad')),
  titulo TEXT NOT NULL CHECK (LENGTH(titulo) <= 30),
  contacto TEXT NOT NULL,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_expiracion TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_adisos_gratuitos_activos 
ON adisos_gratuitos(fecha_expiracion) 
WHERE fecha_expiracion > NOW();

CREATE INDEX IF NOT EXISTS idx_adisos_gratuitos_categoria 
ON adisos_gratuitos(categoria);

-- Habilitar Row Level Security
ALTER TABLE adisos_gratuitos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Todos pueden leer adisos gratuitos activos"
ON adisos_gratuitos 
FOR SELECT 
TO public 
USING (fecha_expiracion > NOW());

CREATE POLICY "Todos pueden crear adisos gratuitos"
ON adisos_gratuitos 
FOR INSERT 
TO public 
WITH CHECK (true);

-- Función para limpiar adisos expirados
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

-- Comentarios
COMMENT ON TABLE adisos_gratuitos IS 'Adisos gratuitos que expiran después de 1 día. Solo visibles en desktop, no indexados en búsqueda, mapa o chatbot.';
COMMENT ON COLUMN adisos_gratuitos.titulo IS 'Título del adiso, máximo 30 caracteres';
COMMENT ON COLUMN adisos_gratuitos.fecha_expiracion IS 'Fecha de expiración del adiso (1 día después de fecha_creacion)';

-- ============================================
-- PASO 3: CREAR BUCKET DE STORAGE "adisos-images"
-- ============================================

-- Crear bucket para imágenes de adisos
INSERT INTO storage.buckets (id, name, public)
VALUES ('adisos-images', 'adisos-images', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas para el bucket
CREATE POLICY "Permitir subir imágenes de adisos"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'adisos-images');

CREATE POLICY "Permitir leer imágenes de adisos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'adisos-images');

-- ============================================
-- PASO 4: VERIFICACIÓN
-- ============================================

-- Verificar tablas creadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%adiso%'
ORDER BY table_name;

-- Verificar buckets
SELECT id, name, public 
FROM storage.buckets 
WHERE id LIKE '%adiso%';

-- Verificar políticas
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('adisos', 'adisos_gratuitos')
ORDER BY tablename, policyname;

