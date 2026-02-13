-- Script para actualizar fechas y vistas de adisos
-- Este script distribuirá ~22,500 adisos entre junio 2024 y diciembre 2025
-- Y agregará vistas tanto en la columna 'vistas' de la tabla adisos como en counters

-- ============================================
-- CONFIGURACIÓN
-- ============================================
-- Fecha inicio: 2024-06-01
-- Fecha fin: 2025-12-31

-- Crear función auxiliar para generar timestamp aleatorio
CREATE OR REPLACE FUNCTION random_timestamp(start_date timestamp, end_date timestamp)
RETURNS timestamp AS $$
BEGIN
    RETURN start_date + random() * (end_date - start_date);
END;
$$ LANGUAGE plpgsql VOLATILE;

-- ============================================
-- PARTE 1: Deshabilitar triggers temporalmente
-- ============================================

-- Deshabilitar todos los triggers en la tabla adisos temporalmente
ALTER TABLE adisos DISABLE TRIGGER ALL;

-- ============================================
-- PARTE 2: Actualizar fechas de publicación
-- ============================================

-- Actualizar fechas de publicación y hora con valores aleatorios
-- TODOS los adisos (activos, inactivos e históricos)
-- También actualizar created_at para que la UI muestre las fechas correctamente
UPDATE adisos
SET 
    fecha_publicacion = DATE(random_timestamp(
        '2024-06-01 00:00:00'::timestamp,
        '2025-12-31 23:59:59'::timestamp
    )),
    hora_publicacion = (random_timestamp(
        '2024-06-01 00:00:00'::timestamp,
        '2025-12-31 23:59:59'::timestamp
    ))::time,
    created_at = random_timestamp(
        '2024-06-01 00:00:00'::timestamp,
        '2025-12-31 23:59:59'::timestamp
    );

-- ============================================
-- PARTE 3: Reactivar triggers
-- ============================================

-- Reactivar todos los triggers
ALTER TABLE adisos ENABLE TRIGGER ALL;

-- ============================================
-- PARTE 4: Actualizar columna 'vistas' en tabla adisos
-- ============================================

-- Actualizar la columna vistas directamente en adisos (50-700)
UPDATE adisos
SET vistas = FLOOR(50 + random() * (700 - 50))::INTEGER;

-- ============================================
-- PARTE 5: Agregar vistas en tabla counters
-- ============================================

-- Primero, asegurémonos de que existe la tabla counters
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'counters') THEN
        CREATE TABLE counters (
            id BIGSERIAL PRIMARY KEY,
            adiso_id TEXT NOT NULL REFERENCES adisos(id) ON DELETE CASCADE,
            type TEXT NOT NULL CHECK (type IN ('view', 'click', 'contact', 'share')),
            count INTEGER DEFAULT 0 NOT NULL,
            last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(adiso_id, type)
        );
        
        CREATE INDEX idx_counters_adiso_type ON counters(adiso_id, type);
        CREATE INDEX idx_counters_type ON counters(type);
    END IF;
END $$;

-- Insertar o actualizar contadores de vistas en counters
-- Usar el mismo valor que se guardó en la columna vistas de adisos
INSERT INTO counters (adiso_id, type, count, last_updated)
SELECT 
    id as adiso_id,
    'view' as type,
    -- Usar el mismo valor de vistas que ya tiene el adiso
    vistas as count,
    -- last_updated aleatorio: fecha_publicacion + hora_publicacion + offset aleatorio de 30min a 7 días
    (fecha_publicacion + hora_publicacion + 
     (INTERVAL '30 minutes' + random() * INTERVAL '7 days'))::timestamp as last_updated
FROM adisos
ON CONFLICT (adiso_id, type) 
DO UPDATE SET 
    count = EXCLUDED.count,
    last_updated = EXCLUDED.last_updated;

-- Agregar también algunos clicks (entre 10% y 30% de las vistas)
-- last_updated con offset adicional de 30 minutos a 2 horas después de las vistas
INSERT INTO counters (adiso_id, type, count, last_updated)
SELECT 
    a.id as adiso_id,
    'click' as type,
    -- Clicks aleatorios entre 10% y 30% de las vistas
    FLOOR((c.count * 0.1) + random() * (c.count * 0.2))::INTEGER as count,
    -- last_updated un poco después que las vistas (30min a 2 horas después)
    (c.last_updated + 
     (INTERVAL '30 minutes' + random() * INTERVAL '90 minutes'))::timestamp as last_updated
FROM adisos a
JOIN counters c ON c.adiso_id = a.id AND c.type = 'view'
ON CONFLICT (adiso_id, type) 
DO UPDATE SET 
    count = EXCLUDED.count,
    last_updated = EXCLUDED.last_updated;

-- Agregar algunos contactos (entre 1% y 5% de las vistas)
-- last_updated con offset adicional de 1 a 5 horas después de las vistas
INSERT INTO counters (adiso_id, type, count, last_updated)
SELECT 
    a.id as adiso_id,
    'contact' as type,
    -- Contactos aleatorios entre 1% y 5% de las vistas
    GREATEST(1, FLOOR((c.count * 0.01) + random() * (c.count * 0.04)))::INTEGER as count,
    -- last_updated bastante después que las vistas (1 a 5 horas después)
    (c.last_updated + 
     (INTERVAL '1 hour' + random() * INTERVAL '4 hours'))::timestamp as last_updated
FROM adisos a
JOIN counters c ON c.adiso_id = a.id AND c.type = 'view'
ON CONFLICT (adiso_id, type) 
DO UPDATE SET 
    count = EXCLUDED.count,
    last_updated = EXCLUDED.last_updated;

-- Agregar algunos shares (entre 0.5% y 2% de las vistas)
-- last_updated con offset adicional de 2 a 10 horas después de las vistas
INSERT INTO counters (adiso_id, type, count, last_updated)
SELECT 
    a.id as adiso_id,
    'share' as type,
    -- Shares aleatorios entre 0.5% y 2% de las vistas
    GREATEST(0, FLOOR((c.count * 0.005) + random() * (c.count * 0.015)))::INTEGER as count,
    -- last_updated mucho después que las vistas (2 a 10 horas después)
    (c.last_updated + 
     (INTERVAL '2 hours' + random() * INTERVAL '8 hours'))::timestamp as last_updated
FROM adisos a
JOIN counters c ON c.adiso_id = a.id AND c.type = 'view'
ON CONFLICT (adiso_id, type) 
DO UPDATE SET 
    count = EXCLUDED.count,
    last_updated = EXCLUDED.last_updated;

-- ============================================
-- PARTE 6: Verificación
-- ============================================

-- Mostrar estadísticas de las actualizaciones
SELECT 
    'Adisos actualizados' as descripcion,
    COUNT(*)::TEXT as cantidad
FROM adisos

UNION ALL

SELECT 
    'Rango de fechas' as descripcion,
    CONCAT(
        TO_CHAR(MIN(fecha_publicacion), 'YYYY-MM-DD'),
        ' a ',
        TO_CHAR(MAX(fecha_publicacion), 'YYYY-MM-DD')
    ) as cantidad
FROM adisos

UNION ALL

SELECT 
    'Rango created_at' as descripcion,
    CONCAT(
        TO_CHAR(MIN(created_at), 'YYYY-MM-DD HH24:MI'),
        ' a ',
        TO_CHAR(MAX(created_at), 'YYYY-MM-DD HH24:MI')
    ) as cantidad
FROM adisos

UNION ALL

SELECT 
    'Total vistas (columna adisos.vistas)' as descripcion,
    COALESCE(SUM(vistas), 0)::TEXT as cantidad
FROM adisos

UNION ALL

SELECT 
    'Promedio vistas por adiso (adisos.vistas)' as descripcion,
    COALESCE(ROUND(AVG(vistas), 2), 0)::TEXT as cantidad
FROM adisos

UNION ALL

SELECT 
    'Total vistas (tabla counters)' as descripcion,
    COALESCE(SUM(count), 0)::TEXT as cantidad
FROM counters
WHERE type = 'view'

UNION ALL

SELECT 
    'Promedio vistas por adiso (counters)' as descripcion,
    COALESCE(ROUND(AVG(count), 2), 0)::TEXT as cantidad
FROM counters
WHERE type = 'view'

UNION ALL

SELECT 
    'Total clicks' as descripcion,
    COALESCE(SUM(count), 0)::TEXT as cantidad
FROM counters
WHERE type = 'click'

UNION ALL

SELECT 
    'Total contactos' as descripcion,
    COALESCE(SUM(count), 0)::TEXT as cantidad
FROM counters
WHERE type = 'contact'

UNION ALL

SELECT 
    'Total shares' as descripcion,
    COALESCE(SUM(count), 0)::TEXT as cantidad
FROM counters
WHERE type = 'share';

-- Limpiar función temporal
DROP FUNCTION IF EXISTS random_timestamp(timestamp, timestamp);

-- ============================================
-- SCRIPT COMPLETADO
-- ============================================
-- Este script ha:
-- 1. DESHABILITADO triggers temporalmente para evitar que se sobrescriba created_at
-- 2. Actualizado las fechas de todos los adisos (~22,500)
--    distribuyéndolos entre junio 2024 y diciembre 2025
-- 3. Asignado horas aleatorias a cada adiso
-- 4. Actualizado created_at con timestamps aleatorios
-- 5. REACTIVADO triggers
-- 6. Agregado entre 50 y 700 vistas en:
--    - La columna adisos.vistas (para la UI)
--    - La tabla counters (para estadísticas)
-- 7. Agregado clicks, contactos y shares proporcionales en counters
-- 8. Asignado timestamps aleatorios realistas (mínimo 30 minutos)
-- ============================================
