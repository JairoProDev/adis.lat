# Migración de "Aviso" a "Adiso" - Instrucciones Completas

## Estado Actual

Todos los archivos de código han sido renombrados y actualizados de "aviso" a "adiso". Sin embargo, **los adisos dejaron de mostrarse** porque probablemente la tabla en Supabase todavía se llama "avisos" y el código busca "adisos".

## Pasos a Seguir

### 1. ✅ Código - COMPLETADO
Todos los archivos de código ya fueron renombrados:
- `GrillaAvisos.tsx` → `GrillaAdisos.tsx` ✅
- `AvisosGratuitos.tsx` → `AdisosGratuitos.tsx` ✅
- `SkeletonAvisos.tsx` → `SkeletonAdisos.tsx` ✅
- `ModalAviso.tsx` → `ModalAdiso.tsx` ✅
- `supabase-avisos-gratuitos.sql` → `supabase-adisos-gratuitos.sql` ✅
- Todos los imports actualizados ✅

### 2. ⚠️ CRÍTICO: Renombrar Tabla en Supabase

**El problema principal**: Si la tabla en Supabase se llama "avisos", los adisos no se mostrarán porque el código busca "adisos".

#### Verificar el nombre de la tabla:

1. Ve a tu proyecto en Supabase Dashboard
2. Navega a "SQL Editor"
3. Ejecuta esta consulta para verificar:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('avisos', 'adisos');
```

#### Si la tabla se llama "avisos":

Ejecuta el script completo en `RENOMBRAR_TABLA_AVISOS.sql`. Este script:
- Renombra la tabla de "avisos" a "adisos"
- Actualiza las políticas RLS
- Mantiene todos los datos intactos

**IMPORTANTE**: Este script es seguro y no perderá datos. Solo renombra la tabla.

#### Si la tabla ya se llama "adisos":

No necesitas hacer nada. El código ya está configurado correctamente.

### 3. Archivos Renombrados

Los siguientes archivos fueron renombrados:
- ✅ `components/SkeletonAvisos.tsx` → `components/SkeletonAdisos.tsx`
- ✅ `supabase-avisos-gratuitos.sql` → `supabase-adisos-gratuitos.sql`

### 4. Verificar que Todo Funcione

Después de renombrar la tabla en Supabase:

1. Refresca la página
2. Los adisos deberían aparecer correctamente
3. Prueba publicar un nuevo adiso
4. Verifica que se guarde y muestre correctamente

### 5. Archivos SQL Actualizados

Los siguientes archivos SQL ya mencionan "adisos" correctamente:
- ✅ `supabase-setup.sql` - Configuración inicial
- ✅ `supabase-adisos-tamaño.sql` - Campo tamaño
- ✅ `supabase-adisos-gratuitos.sql` - Adisos gratuitos

### 6. Tabla de Adisos Gratuitos

La tabla `adisos_gratuitos` ya está correctamente nombrada en el código y en los scripts SQL.

## Resumen

- ✅ **Código**: Todo actualizado a "adiso/adisos"
- ✅ **Archivos**: Todos renombrados
- ⚠️ **Supabase**: Necesitas verificar y renombrar la tabla si se llama "avisos"
- ✅ **Scripts SQL**: Todos actualizados

## Próximo Paso

**EJECUTA EL SCRIPT `RENOMBRAR_TABLA_AVISOS.sql` EN SUPABASE** para resolver el problema de que los adisos no se muestran.

