# Script de Actualización de Fechas y Vistas

## 📋 Resumen

Este script SQL actualiza aproximadamente **22,500 adisos** en la base de datos:

- **Distribuye las fechas** desde **Junio 2024** hasta **Diciembre 2025**
- **Asigna horas aleatorias** a cada adiso
- **Agrega vistas** (entre 297 y 1000) a cada adiso
- **Agrega interacciones** proporcionales (clicks, contactos, shares)

## 🎯 Distribución

### Fechas
- **Período:** Del 1 de junio 2024 al 31 de diciembre 2025
- **Total días:** 579 días
- **Distribución:** ~39 adisos por día (aleatorio)

### Vistas
- **Mínimo:** 297 vistas por adiso
- **Máximo:** 1000 vistas por adiso
- **Total estimado:** ~8 millones de vistas en toda la plataforma

### Interacciones adicionales
- **Clicks:** 10-30% de las vistas
- **Contactos:** 1-5% de las vistas  
- **Shares:** 0.5-2% de las vistas

## ⚙️ Cómo ejecutar

### Opción 1: Desde Supabase Dashboard
1. Ir a **SQL Editor** en Supabase
2. Pegar el contenido de `update_ads_dates_and_views.sql`
3. Hacer clic en **Run**
4. Esperar a que termine (puede tomar 1-2 minutos)

### Opción 2: Desde línea de comandos (psql)
```bash
psql "postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]" -f scripts/update_ads_dates_and_views.sql
```

### Opción 3: Desde el proyecto
```bash
# Asegúrate de tener las variables de entorno configuradas
npm run execute-sql scripts/update_ads_dates_and_views.sql
```

## 📊 Lo que hace el script paso a paso

1. **Crea función auxiliar** `random_timestamp()` para generar timestamps aleatorios
2. **Actualiza tabla `adisos`:**
   - Asigna `fecha_publicacion` aleatoria entre junio 2024 y diciembre 2025
   - Asigna `hora_publicacion` aleatoria en formato HH:MM
   - Actualiza `updated_at` a la fecha actual

3. **Verifica/crea tabla `counters`** si no existe

4. **Inserta/actualiza vistas:**
   - Cada adiso recibe entre 297 y 1000 vistas
   - Tipo: `'view'`

5. **Inserta/actualiza clicks:**
   - Entre 10% y 30% de las vistas
   - Tipo: `'click'`

6. **Inserta/actualiza contactos:**
   - Entre 1% y 5% de las vistas
   - Tipo: `'contact'`

7. **Inserta/actualiza shares:**
   - Entre 0.5% y 2% de las vistas
   - Tipo: `'share'`

8. **Muestra estadísticas** del resultado:
   - Total de adisos actualizados
   - Rango de fechas
   - Totales y promedios de interacciones

9. **Limpia** la función temporal

## ⚠️ Precauciones

- Este script **modifica datos existentes**
- Se recomienda hacer un **backup** antes de ejecutar
- Solo afecta adisos con `esta_activo = true`
- Usa `ON CONFLICT` para evitar duplicados en counters

## 🔄 Reversión

Si necesitas revertir los cambios:

```sql
-- Restaurar fechas originales (si tienes backup)
-- O establecer una fecha específica
UPDATE adisos 
SET fecha_publicacion = '2024-06-20',
    hora_publicacion = '09:00'
WHERE esta_activo = true;

-- Resetear counters
DELETE FROM counters;
```

## 📈 Resultados esperados

Después de ejecutar el script, deberías ver:
- ✅ ~22,500 adisos con fechas distribuidas
- ✅ ~22,500 registros de vistas en counters
- ✅ ~22,500 registros de clicks en counters
- ✅ ~22,500 registros de contactos en counters
- ✅ ~22,500 registros de shares en counters

## 🎨 Visualización

Las fechas se distribuirán de manera uniforme y aleatoria a lo largo de:
- **Junio 2024**
- **Julio - Diciembre 2024**
- **Enero - Diciembre 2025**

Esto creará una apariencia de actividad constante en la plataforma.

---

**Creado:** Diciembre 2024  
**Autor:** Sistema automatizado  
**Propósito:** Poblar datos históricos y de actividad
