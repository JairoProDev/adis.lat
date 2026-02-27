# Guía de Subida de Anuncios desde TXT

Este repositorio ahora cuenta con la capacidad de subir anuncios procesados manualmente (etapa de separación en TXT) de forma masiva y automatizada.

## Estructura de Datos
Los archivos TXT separados por página deben ubicarse en:
`output/adis-separados/[NOMBRE_EDICION]/` (ej: `pag1`, `pag2`, etc.)

## Script de Subida
Se ha creado el script `scripts/subir-edicion-txt.ts` que realiza lo siguiente:
1. Lee cada archivo de página.
2. Extrae Título y Descripción.
3. Extrae contactos y limpia la descripción.
4. Detecta categoría automáticamente.
5. Genera IDs cortos (formato Nanoid).
6. Configura el tamaño a `pequeño` (para mostrar descripción e íconos).
7. Sube a Supabase con `upsert`.

## Comandos de Ejecución

Para procesar una edición completa, usa el siguiente comando (ajustando la fecha a la deseada para el visualizador "Hace X tiempo"):

```bash
# Ejemplo para la última edición subida
npx tsx scripts/subir-edicion-txt.ts --carpeta=R2706-Feb26-Mar01 --edicion=R2706 --fecha=2026-02-27
```

> [!TIP]
> Si la `--fecha` coincide con hoy, el script usará la hora actual para que los anuncios aparezcan como "Hace instantes".

## Consideraciones
- El script activa los anuncios por defecto (`estaActivo: true`).
- Se usa el `tamaño: pequeño` para asegurar que se vea texto descriptivo y el ícono de categoría actúe como imagen de stock si no hay una original.
