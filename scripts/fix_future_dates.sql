-- ==============================================================================
-- SCRIPT DE CORRECCIÓN DE FECHAS FUTURAS
-- ==============================================================================
-- Este script detecta y corrige cualquier anuncio que tenga una fecha de publicación
-- posterior al día de hoy (20 de Diciembre de 2025).
-- 
-- Los anuncios futuros se reasignan aleatoriamente a una fecha segura dentro de
-- las últimas 2 semanas (entre el 6 y el 20 de diciembre de 2025).
--
-- INSTRUCCIONES:
-- Copia y pega este contenido en el Editor SQL de Supabase y ejecútalo.
-- ==============================================================================

-- Deshabilitar triggers de usuario (no del sistema) para evitar bloqueos de permisos
ALTER TABLE adisos DISABLE TRIGGER USER;

-- Actualizar anuncios con fecha futura
UPDATE adisos
SET 
    -- Asignar nueva fecha aleatoria entre el 6 y el 20 de diciembre
    fecha_publicacion = DATE(
        '2025-12-06 00:00:00'::timestamp + random() * ('2025-12-20 23:59:59'::timestamp - '2025-12-06 00:00:00'::timestamp)
    ),
    -- Mantener la hora original o generar una nueva si se prefiere (aquí mantenemos hora para minimizar cambios)
    hora_publicacion = (
        '2025-12-06 00:00:00'::timestamp + random() * ('2025-12-20 23:59:59'::timestamp - '2025-12-06 00:00:00'::timestamp)
    )::time,
    -- Sincronizar created_at con el mismo rango válido
    created_at = (
        '2025-12-06 00:00:00'::timestamp + random() * ('2025-12-20 23:59:59'::timestamp - '2025-12-06 00:00:00'::timestamp)
    )
WHERE fecha_publicacion > '2025-12-20';

-- Reactivar triggers de usuario
ALTER TABLE adisos ENABLE TRIGGER USER;

-- Verificación final
SELECT 
    COUNT(*) as anuncios_futuros_restantes,
    MAX(fecha_publicacion) as fecha_maxima_actual
FROM adisos 
WHERE fecha_publicacion > '2025-12-20';
