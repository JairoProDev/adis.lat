# Script de Carga Masiva de Adisos Históricos

Este script procesa y carga adisos históricos desde archivos TXT organizados en carpetas.

## Estructura de Archivos

```
/home/jairoprodev/proyectos/adisos-processing/procesamiento/04-anuncios-separados/
├── R2538-Jun20-26/
│   ├── pagina-01.txt
│   ├── pagina-02.txt
│   └── ...
├── R2539-Jun27-30/
│   └── ...
└── ...
```

**Formato de cada línea en los archivos TXT:**
```
NÚMERO. TÍTULO: DESCRIPCIÓN
```

Ejemplo:
```
1. BUSCO DEPARTAMENTO EN ALQUILER: NECESITO UN DEPARTAMENTO MODERNO: Ubicado en zonas como: Marcavalle, Magisterio, Manuel Prado o cerca de la Plaza De Armas de cusco. Requisitos: de 3 habitaciones, 3 o 2 baños completos. Si tienes alguna propiedad disponible. No dudes en contactarme a los Cels. 981813470, 930234266.
```

## Características del Script

- ✅ Parsea automáticamente título y descripción separados por ":"
- ✅ Extrae números de teléfono (9 dígitos empezando con 9)
- ✅ Extrae emails
- ✅ Detecta si es WhatsApp o teléfono normal
- ✅ Limpia la descripción removiendo información de contacto
- ✅ Detecta categoría automáticamente (empleos, inmuebles, vehículos, etc.)
- ✅ Marca adisos como históricos (`esHistorico: true`)
- ✅ Marca como no contactables (`estaActivo: false`)
- ✅ Carga en lotes de 100 para optimizar rendimiento
- ✅ Maneja errores y duplicados

## Uso

### Probar con una carpeta específica (recomendado primero)

```bash
npx tsx scripts/cargar-adisos-historicos.ts --carpeta=R2561-Sep16-18
```

### Probar sin cargar (dry-run)

```bash
npx tsx scripts/cargar-adisos-historicos.ts --carpeta=R2561-Sep16-18 --dry-run
```

### Cargar todas las carpetas

```bash
npx tsx scripts/cargar-adisos-historicos.ts --todas
```

## Parámetros

- `--carpeta=NOMBRE`: Procesa solo una carpeta específica
- `--todas`: Procesa todas las carpetas encontradas
- `--dry-run`: Solo procesa y muestra estadísticas, NO carga a Supabase

## Proceso de Carga

1. **Lectura**: Lee todos los archivos .txt de la(s) carpeta(s)
2. **Parseo**: Cada línea se parsea como "TÍTULO: DESCRIPCIÓN"
3. **Extracción**: Extrae números de teléfono y emails de la descripción
4. **Limpieza**: Remueve contactos de la descripción
5. **Detección**: Detecta categoría automáticamente
6. **Creación**: Crea objetos Adiso con:
   - `esHistorico: true`
   - `estaActivo: false` (no contactable directamente)
   - `fuenteOriginal: 'rueda_negocios'`
   - `edicionNumero`: Extraído del nombre de carpeta
   - Contactos en `contactosMultiples`
7. **Carga**: Inserta en Supabase en lotes de 100

## Sistema de Intereses

Cuando un usuario intenta contactar un adiso histórico:

1. Se registra el interés en `intereses_anuncios_caducados`
2. Se muestra mensaje: "Este es un anuncio histórico. Hemos registrado tu interés y notificaremos al anunciante. Si decide republicar su anuncio oficialmente, podrás contactarlo directamente o le pasaremos tu información de contacto."
3. El anunciante puede:
   - Ver los intereses registrados
   - Pagar para republicar su anuncio
   - Recibir información de contactos interesados

## Estadísticas

El script muestra:
- Total de carpetas procesadas
- Total de archivos procesados
- Total de líneas leídas
- Adisos procesados exitosamente
- Adisos cargados a Supabase
- Errores (si los hay)

## Notas Importantes

- ⚠️ Los adisos históricos NO son contactables directamente
- ✅ Los usuarios pueden registrar interés
- ✅ El anunciante puede republicar pagando
- ✅ Se pueden pasar datos de contactos interesados al anunciante

## Solución de Problemas

### Error: "Faltan variables de entorno"
Asegúrate de tener `.env.local` con:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### Error: "Carpeta no encontrada"
Verifica que la ruta en `CARPETAS_BASE` sea correcta.

### Errores de duplicados
El script maneja duplicados automáticamente, intentando insertar uno por uno si falla el lote.

