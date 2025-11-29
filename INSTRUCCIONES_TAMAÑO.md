# ⚠️ IMPORTANTE: Agregar columna "tamaño" a Supabase

## Problema
El error `PGRST204: Could not find the 'tamaño' column` indica que la columna `tamaño` no existe en la tabla `avisos` de Supabase.

## Solución

1. **Abre Supabase Dashboard**
   - Ve a tu proyecto en https://supabase.com
   - Navega a "SQL Editor"

2. **Ejecuta el script SQL**
   - Abre el archivo `supabase-avisos-tamaño.sql` en este proyecto
   - Copia y pega el contenido completo en el SQL Editor
   - Haz clic en "Run" o presiona Ctrl+Enter

3. **Verifica que se ejecutó correctamente**
   - Deberías ver un mensaje de éxito
   - La columna `tamaño` debería aparecer en la tabla `avisos`

## Script SQL

```sql
-- Agregar columna tamaño si no existe
ALTER TABLE avisos 
ADD COLUMN IF NOT EXISTS tamaño TEXT DEFAULT 'miniatura';

-- Crear índice para mejorar búsquedas por tamaño
CREATE INDEX IF NOT EXISTS idx_avisos_tamaño ON avisos(tamaño);

-- Comentario en la columna
COMMENT ON COLUMN avisos.tamaño IS 'Tamaño del paquete: miniatura, pequeño, mediano, grande, gigante';
```

## Después de ejecutar

Una vez ejecutado el script, los avisos se podrán guardar correctamente en Supabase con su tamaño correspondiente.

