# Instrucciones Completas - Migración "Aviso" → "Adiso"

## Resumen

Tu startup se llama **"Adis"** y por estrategia de branding, necesitas eliminar completamente la palabra "aviso" y reemplazarla por "adiso" en **todo**: código, base de datos, storage, etc.

## Estado Actual

✅ **Código**: Todo actualizado a "adiso/adisos"
✅ **Archivos**: Todos renombrados
✅ **Rutas API**: `/api/adisos` y `/api/adisos-gratuitos`
⚠️ **Supabase**: Necesita actualización (tablas, buckets, políticas)

## ¿Qué Debes Hacer en Supabase?

Tienes **2 opciones**:

### OPCIÓN 1: Migrar (Recomendado si tienes datos importantes)

Si quieres **conservar los datos existentes**, ejecuta:
- `MIGRACION_COMPLETA_ADISO.sql` - Renombra todo manteniendo datos

### OPCIÓN 2: Crear desde Cero (Más Limpio)

Si **no te importan los datos actuales** y quieres empezar limpio:
1. Ejecuta: `ELIMINAR_TODOS_LOS_ADISOS.sql` - Elimina todos los datos
2. Ejecuta: `CREAR_TODO_DESDE_CERO_ADISO.sql` - Crea todo con nombres correctos

## Pasos Recomendados (Opción 2 - Desde Cero)

### Paso 1: Eliminar Tablas Antiguas (si existen)

```sql
-- Eliminar políticas primero
DROP POLICY IF EXISTS "Todos pueden leer avisos" ON avisos;
DROP POLICY IF EXISTS "Todos pueden crear avisos" ON avisos;
DROP POLICY IF EXISTS "Todos pueden leer avisos gratuitos activos" ON avisos_gratuitos;
DROP POLICY IF EXISTS "Todos pueden crear avisos gratuitos" ON avisos_gratuitos;

-- Eliminar tablas
DROP TABLE IF EXISTS avisos CASCADE;
DROP TABLE IF EXISTS avisos_gratuitos CASCADE;

-- Eliminar buckets antiguos (opcional, eliminará las imágenes)
DELETE FROM storage.buckets WHERE id = 'avisos-images';
```

### Paso 2: Ejecutar Script de Creación

Ejecuta el script completo: **`CREAR_TODO_DESDE_CERO_ADISO.sql`**

Este script creará:
- ✅ Tabla `adisos` con todas las columnas necesarias
- ✅ Tabla `adisos_gratuitos` 
- ✅ Índices optimizados
- ✅ Políticas RLS correctas
- ✅ Bucket `adisos-images` para imágenes
- ✅ Funciones necesarias

### Paso 3: Verificar

Después de ejecutar, verifica:

```sql
-- Verificar tablas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE '%adiso%';

-- Verificar buckets
SELECT id, name FROM storage.buckets WHERE id LIKE '%adiso%';
```

## ¿Qué Hacer con los Scripts SQL Guardados en Supabase?

Los scripts que guardaste en Supabase (como "Avisos gratuitos temporales", etc.) son solo **referencias/plantillas**. Puedes:

- ✅ **Dejarlos**: No afectan nada, son solo consultas guardadas
- ✅ **Eliminarlos**: Si quieres mantener limpio, puedes borrarlos desde el SQL Editor
- ✅ **Actualizarlos**: Renombrar las consultas para que digan "Adisos" en lugar de "Avisos"

**Recomendación**: Déjalos por ahora, son solo referencias útiles.

## Límites de Supabase Free

📄 Ver archivo: `LIMITES_SUPABASE_FREE.md`

Resumen rápido:
- **Base de datos**: 500 MB
- **Storage**: 1 GB
- **Transferencia**: 5 GB/mes DB + 2 GB/mes Storage

**Para tu startup es perfecto para empezar.**

## Checklist Final

- [x] Código actualizado a "adiso"
- [x] Archivos renombrados
- [x] Rutas API actualizadas
- [ ] **Ejecutar SQL en Supabase** (elegir opción 1 o 2 arriba)
- [ ] Verificar que los adisos se muestren correctamente
- [ ] Probar publicar un nuevo adiso
- [ ] Verificar que las imágenes se suban correctamente

## ¿Falta Modificar Algo en el Código?

**NO**, todo el código ya está actualizado. Solo falta ejecutar el SQL en Supabase.

Los archivos que fueron actualizados:
- ✅ `lib/supabase.ts` - Busca tabla `adisos`
- ✅ `lib/api.ts` - Funciones para `adisos`
- ✅ `lib/storage.ts` - Funciones para `adisos`
- ✅ `app/api/adisos/route.ts` - Endpoint correcto
- ✅ `app/api/adisos-gratuitos/route.ts` - Endpoint correcto
- ✅ Todos los componentes renombrados

## Después de Ejecutar el SQL

1. Refresca tu aplicación
2. Los adisos deberían cargarse correctamente
3. Prueba publicar un nuevo adiso
4. Verifica que se guarde en Supabase
5. Verifica que las imágenes se suban al bucket correcto

¡Listo! 🚀

