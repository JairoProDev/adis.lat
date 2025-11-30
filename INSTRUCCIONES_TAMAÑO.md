# ⚠️ IMPORTANTE: Agregar columna "tamaño" a Supabase

## Problema
El error `PGRST204: Could not find the 'tamaño' column` indica que la columna `tamaño` no existe en la tabla `adisos` de Supabase.

## Solución

1. **Abre Supabase Dashboard**
   - Ve a tu proyecto en https://supabase.com
   - Navega a "SQL Editor"

2. **Ejecuta el script SQL**
   - Abre el archivo `supabase-adisos-tamaño.sql` en este proyecto
   - Copia y pega el contenido completo en el SQL Editor
   - Haz clic en "Run" o presiona Ctrl+Enter

3. **Verifica que se ejecutó correctamente**
   - Deberías ver un mensaje de éxito
   - La columna `tamaño` debería aparecer en la tabla `adisos`

## Script SQL

```sql
-- Agregar columna tamaño si no existe
ALTER TABLE adisos 
ADD COLUMN IF NOT EXISTS tamaño TEXT DEFAULT 'miniatura';

-- Crear índice para mejorar búsquedas por tamaño
CREATE INDEX IF NOT EXISTS idx_adisos_tamaño ON adisos(tamaño);

-- Comentario en la columna
COMMENT ON COLUMN adisos.tamaño IS 'Tamaño del paquete: miniatura, pequeño, mediano, grande, gigante';
```

## Después de ejecutar

Una vez ejecutado el script, los adisos se podrán guardar correctamente en Supabase con su tamaño correspondiente.

