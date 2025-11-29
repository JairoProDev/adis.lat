# Buscadis - MVP de Avisos Clasificados

MVP simple para publicar y visualizar avisos clasificados en buscadis.com

## Características

- ✅ Publicación de avisos con categoría, título, descripción, contacto y ubicación
- ✅ Grilla responsive: 2 columnas en mobile, 4 en desktop
- ✅ Buscador en tiempo real
- ✅ Filtros por categoría (empleos, inmuebles, vehículos, servicios, productos, eventos, negocios, comunidad)
- ✅ Modal de detalle responsive:
  - Mobile: aparece desde abajo
  - Desktop: aparece al costado derecho
- ✅ Navegación entre avisos:
  - Teclas de flecha (← →)
  - Botones anterior/siguiente
  - Swipe gestual en mobile
- ✅ Compartir avisos:
  - Copiar link con un click
  - Compartir nativo (compartir del sistema)
- ✅ Contacto por WhatsApp con mensaje predeterminado
- ✅ Diseño minimalista en escala de grises

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Construcción

```bash
npm run build
npm start
```

## Tecnologías

- Next.js 14
- React 18
- TypeScript
- localStorage (almacenamiento temporal para MVP)

## Base de Datos

### Configuración Inicial (Una sola vez)

1. Crea la tabla en Supabase (ya lo hice)
2. Ejecuta el SQL en `supabase-setup.sql` en Supabase SQL Editor (solo una vez)
3. Agrega tus credenciales en `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_aqui
   NEXT_PUBLIC_USE_LOCAL_STORAGE=false
   ```
4. Reinicia el servidor: `npm run dev`

## Notas

- **Fecha exacta**: Ahora muestra la fecha y hora exacta de publicación
- El número de contacto nunca se muestra públicamente
- Los avisos se ordenan por fecha (más recientes primero)

## Problemas Comunes

### Error de Webpack / Página en Blanco
Si ves errores de webpack o la página en blanco, lee `PROBLEMA_NAVEGADOR.md` para soluciones rápidas.

