# Límites de Supabase Free (Hobby Plan)

## Base de Datos PostgreSQL

- **Espacio**: 500 MB
- **Transferencia de datos**: 5 GB/mes
- **Backups automáticos**: 1 diario (mantenidos por 7 días)
- **Conexiones simultáneas**: 60 conexiones directas
- **Tiempo máximo de consulta**: 60 segundos

## Storage (Almacenamiento de Archivos)

- **Espacio total**: 1 GB
- **Transferencia**: 2 GB/mes
- **Límite de archivo**: 50 MB por archivo
- **Buckets**: Ilimitados

## Authentication (Autenticación)

- **Usuarios activos**: 50,000 MAU (Monthly Active Users)
- **Usuarios totales**: 50,000
- **SMS**: No incluido (requiere upgrade)
- **SAML**: No incluido (requiere upgrade)

## API y Edge Functions

- **API requests**: 500 MB/mes
- **Edge Functions**: 500,000 invocations/mes
- **Tiempo de ejecución**: 10 segundos por función

## Recomendaciones para tu Proyecto

### Gestión de Espacio

1. **Imágenes de adisos**: 
   - Optimiza las imágenes antes de subirlas
   - Considera comprimir las imágenes en el cliente
   - Máximo 50 MB por imagen (pero recomiendo < 5 MB)

2. **Base de datos**:
   - Los adisos ocupan poco espacio (texto)
   - Las imágenes están en Storage, no en la DB
   - Con 500 MB puedes tener miles de adisos

3. **Limpieza automática**:
   - Los adisos gratuitos expiran automáticamente
   - Considera eliminar adisos muy antiguos si superas el límite

### Cuándo Considerar Upgrade

- Si superas los **500 MB de base de datos**
- Si superas **1 GB de Storage** (muchas imágenes)
- Si necesitas más de **5 GB/mes de transferencia**
- Si necesitas más de **60 conexiones simultáneas**
- Si necesitas backups más frecuentes o por más tiempo

## Monitoreo

Puedes monitorear tu uso en:
- Supabase Dashboard → Settings → Usage
- Ahí verás el uso actual de DB, Storage, API, etc.

## Para tu Startup "Adis"

Con el plan Free puedes empezar perfectamente. Solo considera optimizar las imágenes y monitorear el uso. Cuando crezcas, podrás hacer upgrade fácilmente.

