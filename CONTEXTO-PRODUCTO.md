# 📚 Contexto Completo: Buscadis / ADIS.lat

> **Documento de contexto para LLMs**  
> Este documento contiene toda la información relevante sobre la startup, el producto, la tecnología y el modelo de negocio de Buscadis.

---

## 🏢 Información de la Empresa

### Empresa
- **Nombre Legal**: ADIS TECHNOLOGICAL PLATFORMS S.A.C.
- **Holding Principal**: adis.lat
- **Producto Principal**: Buscadis (buscadis.com)
- **Mercado Inicial**: Cusco, Perú
- **Expansión Futura**: Global (Latinoamérica y más)

### Estrategia de Naming y Dominios
- **Nombre del Producto**: "Buscadis" (mantener)
- **Dominio Público**: buscadis.com (redirige a market.adis.lat)
- **Subdominio Técnico**: market.adis.lat
- **Branding**: "Buscadis - Marketplace de ADIS"

**Razones del naming**:
- Nombre corto y memorable (8 caracteres)
- Fácil de pronunciar en español
- Mantiene identidad de marca ADIS
- Funciona bien para mercado local
- "Busca" es acción clara y directa

---

## 🎯 Descripción del Producto

### ¿Qué es Buscadis?

**Buscadis** es una plataforma digital de anuncios clasificados (marketplace) que permite a usuarios publicar y buscar oportunidades, productos, servicios y más en un formato moderno y fácil de usar.

### Propuesta de Valor

1. **Para Anunciantes**:
   - Publicación rápida y sencilla de anuncios
   - Sistema de paquetes de publicación con diferentes tamaños y precios
   - Mayor visibilidad según el paquete seleccionado
   - Adisos gratuitos de 1 día (limitados)
   - Múltiples formas de contacto (teléfono, WhatsApp, email)

2. **Para Buscadores**:
   - Búsqueda en tiempo real por título, descripción y ubicación
   - Filtros avanzados por categoría, ubicación y distancia
   - Navegación intuitiva entre anuncios
   - Compartir anuncios fácilmente
   - Chatbot con IA para búsquedas semánticas
   - Mapa interactivo de anuncios
   - Acceso a anuncios históricos de revistas impresas

### Categorías Disponibles

1. **Empleos** - Ofertas de trabajo y búsqueda de empleo
2. **Inmuebles** - Casas, departamentos, terrenos, alquileres
3. **Vehículos** - Autos, motos, bicicletas, repuestos
4. **Servicios** - Servicios profesionales y personales
5. **Productos** - Artículos en venta
6. **Eventos** - Cursos, talleres, eventos, actividades
7. **Negocios** - Traspasos, franquicias, oportunidades de negocio
8. **Comunidad** - Anuncios comunitarios, perdidos y encontrados

---

## 💰 Modelo de Negocio

### Sistema de Paquetes de Publicación

Buscadis opera con un modelo freemium donde los anunciantes pueden elegir entre diferentes paquetes según su presupuesto y necesidades de visibilidad:

| Paquete | Precio | Tamaño Visual | Imágenes | Descripción |
|---------|--------|----------------|----------|-------------|
| **Miniatura** | S/ 15 | 1x1 | 0 | Sin imagen, tamaño mínimo |
| **Pequeño** | S/ 25 | 1x2 | 1 | Una imagen, tamaño compacto |
| **Mediano** | S/ 45 | 2x2 | 3 | Tres imágenes, tamaño estándar |
| **Grande** | S/ 85 | 2x4 | 5 | Cinco imágenes, tamaño destacado |
| **Gigante** | S/ 125 | 2x6 | 10 | Diez imágenes, máximo tamaño y visibilidad |

**Características del modelo**:
- Mayor precio = Mayor tamaño visual en la grilla
- Paquetes más caros permiten más imágenes
- El paquete básico (Miniatura) no permite imágenes para incentivar upgrades
- Los adisos se muestran en la grilla según su tamaño (responsive)

### Adisos Gratuitos

- **Duración**: 1 día (24 horas)
- **Límites**: 
  - Título máximo 30 caracteres
  - Sin imágenes
  - Solo visibles en desktop (no en mobile)
  - No indexados en búsqueda, mapa o chatbot
- **Propósito**: Permitir que usuarios prueben la plataforma antes de pagar

### Monetización Adicional (Futuro)

- Sistema de verificación de usuarios y negocios
- Anuncios destacados en búsquedas
- Notificaciones a anunciantes sobre intereses en anuncios caducados
- API para integraciones externas (con API keys)

---

## 🚀 Características Principales

### Para Usuarios Finales

1. **Búsqueda en Tiempo Real**
   - Búsqueda instantánea por título, descripción y ubicación
   - Filtros por categoría
   - Filtros por ubicación (departamento, provincia, distrito)
   - Filtro por radio de distancia (km)
   - Ordenamiento: más recientes, más antiguos, título A-Z, título Z-A

2. **Navegación Intuitiva**
   - Modal responsive (desde abajo en mobile, lateral en desktop)
   - Navegación entre anuncios con:
     - Teclas de flecha (← →)
     - Botones anterior/siguiente
     - Swipe gestual en mobile
   - Prefetching automático de imágenes relacionadas

3. **Compartir y Contactar**
   - Copiar link con un click
   - Compartir nativo (compartir del sistema)
   - Contacto directo por WhatsApp con mensaje predeterminado
   - Múltiples contactos por anuncio (teléfono, WhatsApp, email)

4. **Experiencia Visual**
   - Diseño minimalista en escala de grises
   - Modo oscuro con soporte automático según preferencias del sistema
   - Grilla responsive: 2 columnas en mobile, 4 en desktop
   - Imágenes optimizadas con lazy loading
   - Scroll infinito para carga progresiva

5. **Funcionalidades Avanzadas**
   - Chatbot con IA para búsquedas semánticas
   - Mapa interactivo de anuncios
   - Sistema de favoritos
   - Feedback y reportes
   - Anuncios históricos de revistas impresas

### Para Anunciantes

1. **Publicación de Anuncios**
   - Formulario intuitivo con validación en tiempo real
   - Selector visual de paquetes con precios
   - Subida múltiple de imágenes (hasta 10 según paquete)
   - Validación automática de límites de imágenes
   - Ubicación detallada (departamento, provincia, distrito, coordenadas)
   - Múltiples contactos por anuncio

2. **Gestión de Anuncios**
   - Fecha de expiración configurable
   - Estado activo/inactivo
   - Historial de publicaciones
   - Notificaciones sobre intereses en anuncios caducados

---

## 🏗️ Arquitectura Técnica

### Stack Tecnológico

**Frontend**:
- **Next.js 14** (App Router)
- **React 18** con TypeScript
- **next-intl** para internacionalización
- **React Icons** para iconografía
- **Zod** para validación de esquemas

**Backend**:
- **Next.js API Routes** (serverless)
- **Supabase** como BaaS (Backend as a Service)
  - PostgreSQL como base de datos
  - Row Level Security (RLS) para seguridad
  - Storage para imágenes
  - Autenticación

**Servicios Externos**:
- **Resend** para envío de emails
- **Sharp** para procesamiento de imágenes

**Infraestructura**:
- Hosting: Vercel (probablemente)
- CDN: Vercel Edge Network
- Base de datos: Supabase PostgreSQL
- Storage: Supabase Storage

### Estructura del Proyecto

```
adis.lat/
├── app/                    # Next.js App Router
│   ├── [categoria]/        # Páginas dinámicas por categoría
│   ├── [id]/              # Páginas de detalle de anuncios
│   ├── api/               # API Routes
│   │   ├── adisos/        # CRUD de anuncios
│   │   ├── adisos-gratuitos/  # Adisos gratuitos
│   │   ├── chatbot/       # Endpoint del chatbot IA
│   │   ├── feedback/      # Sistema de feedback
│   │   ├── upload-image/  # Subida de imágenes
│   │   └── v1/            # API v1 para integraciones
│   ├── auth/              # Autenticación
│   ├── admin/             # Panel de administración
│   └── progreso/          # Página de changelog
├── components/            # Componentes React reutilizables
├── lib/                   # Utilidades y helpers
├── types/                 # Definiciones TypeScript
├── hooks/                 # Custom React hooks
├── contexts/              # React contexts
├── messages/              # Traducciones (i18n)
├── scripts/               # Scripts de procesamiento
└── output/                # Archivos generados
```

### Base de Datos (Supabase)

#### Tablas Principales

1. **adisos**
   - Almacena todos los anuncios publicados
   - Campos: id, categoria, titulo, descripcion, contacto, ubicacion, fecha_publicacion, hora_publicacion, tamaño, imagenes_urls, es_gratuito, fecha_expiracion, esta_activo, es_historico, fuente_original, edicion_numero, fecha_publicacion_original, contactos_multiples

2. **adisos_gratuitos**
   - Almacena adisos gratuitos (expiran en 1 día)
   - Campos: id, categoria, titulo, contacto, fecha_creacion, fecha_expiracion

3. **profiles**
   - Perfiles de usuarios
   - Campos: id, email, nombre, apellido, telefono, avatar_url, ubicacion, latitud, longitud, rol, es_verificado, etc.

4. **favoritos**
   - Anuncios marcados como favoritos por usuarios
   - Campos: id, user_id, adiso_id, created_at

5. **intereses_anuncios_caducados**
   - Registra intereses de usuarios en anuncios caducados
   - Campos: id, adiso_id, usuario_id, contacto_usuario, mensaje, fecha_interes, notificado_anunciante

6. **datos_toon_anuncios**
   - Almacena versión TOON (Token Oriented Object Notation) de cada anuncio para búsquedas semánticas del chatbot
   - Campos: id, adiso_id, contenido_toon, fecha_actualizacion

7. **api_keys**
   - API keys para autenticación de API externa
   - Campos: id, key_hash, nombre, descripcion, activa, rate_limit_per_hour, permisos

8. **user_analytics**
   - Analytics de eventos de usuarios
   - Campos: id, user_id, evento, tipo_evento, datos, created_at

### Seguridad

- **Row Level Security (RLS)** habilitado en todas las tablas
- Políticas de acceso configuradas:
  - Lectura pública de anuncios activos
  - Creación pública de anuncios
  - Modificación solo por propietario o admin
- Validación robusta con Zod en todas las rutas API
- Sanitización de entrada para prevenir XSS
- Rate limiting por IP
- Protección CSRF básica
- CORS configurado

---

## 📊 Sistema de Anuncios Históricos

### Contexto

Buscadis está digitalizando anuncios históricos de la revista impresa "Rueda de Negocios" de Cusco, Perú. Este proceso permite:

1. **Digitalización de contenido histórico**: Convertir anuncios impresos en datos estructurados
2. **Búsqueda en archivo histórico**: Los usuarios pueden buscar en anuncios antiguos
3. **Valor agregado**: Diferenciación competitiva con contenido histórico único

### Proceso de Digitalización

El proceso completo consta de 5 pasos:

#### Paso 1: Extracción de Texto de PDFs
- **Script**: `scripts/extraer-texto-pdfs.ts`
- **Proceso**: Extrae texto de PDFs de revistas (pueden estar partidos en carpetas o completos)
- **Entrada**: Directorio con PDFs de revistas
- **Salida**: JSON con texto extraído por página y edición

```bash
npx ts-node scripts/extraer-texto-pdfs.ts --todo ~/Desktop/Magazines --salida ./output/texto-extraido
```

#### Paso 2: Generación de Prompts para LLMs
- **Script**: `scripts/generar-prompts-llm.ts`
- **Proceso**: Genera prompts estructurados divididos en 3 partes para procesamiento paralelo
- **LLMs utilizados**: ChatGPT 5 High, Claude Opus 4.5, Gemini 3 Pro
- **Salida**: Archivos de prompts organizados por LLM

```bash
npx ts-node scripts/generar-prompts-llm.ts ./output/texto-extraido/texto-extraido.json ./output/prompts
```

#### Paso 3: Procesamiento con LLMs
- **Proceso Manual**: Copiar prompts a cada LLM y obtener respuestas JSON
- **Formato esperado**: JSON estricto con estructura de anuncios
- **Distribución**: ~450 páginas por LLM (total ~1350 páginas)

#### Paso 4: Consolidación de Respuestas
- **Script**: `scripts/consolidar-respuestas.ts`
- **Proceso**: Combina respuestas de los 3 LLMs, elimina duplicados, valida estructura
- **Salida**: JSON consolidado listo para cargar a BD

```bash
npx ts-node scripts/consolidar-respuestas.ts ./output/prompts
```

#### Paso 5: Carga a Base de Datos
- **Script**: `scripts/cargar-anuncios-masivo.ts`
- **Proceso**: Carga anuncios consolidados a Supabase
- **Validaciones**: Categorías, contactos, ubicaciones
- **Marcado**: Anuncios marcados como `es_historico: true`

### Estructura de Datos Históricos

Los anuncios históricos incluyen campos adicionales:
- `es_historico: true`
- `fuente_original: 'rueda_negocios'`
- `edicion_numero: 'R2538'` (número de edición de la revista)
- `fecha_publicacion_original: '2024-06-20'` (fecha original de publicación)
- `tamaño_visual: 'miniatura|pequeño|mediano|grande|gigante'` (tamaño en la revista)
- `contactos_multiples: [...]` (múltiples contactos extraídos)

### Estado Actual

- **Proceso en desarrollo**: Sistema completo implementado, en proceso de digitalización
- **Objetivo**: ~45,000+ anuncios históricos digitalizados
- **Fuente**: Revistas "Rueda de Negocios" de Cusco, Perú

---

## 🤖 Chatbot con IA

### Funcionalidad

Buscadis incluye un chatbot con IA que permite búsquedas semánticas en los anuncios.

### Tecnología

- **Formato TOON**: Los anuncios se almacenan en formato TOON (Token Oriented Object Notation) para búsquedas semánticas
- **Tabla**: `datos_toon_anuncios` almacena el contenido TOON de cada anuncio
- **Endpoint**: `/api/chatbot` procesa las consultas del usuario
- **Búsqueda**: Búsqueda full-text con pg_trgm en PostgreSQL

### Características

- Búsqueda semántica (entender intención, no solo palabras clave)
- Respuestas contextuales
- Integración con el sistema de anuncios

---

## 🗺️ Mapa Interactivo

### Funcionalidad

Buscadis incluye un mapa interactivo que muestra la ubicación de los anuncios.

### Características

- Visualización de anuncios en mapa
- Filtros por ubicación y distancia
- Integración con coordenadas GPS
- Búsqueda por radio de distancia

---

## 📱 Responsive Design

### Mobile

- **Grilla**: 2 columnas
- **Modal**: Aparece desde abajo (overlay 85% de pantalla)
- **Navegación**: Navbar inferior permanente
- **Secciones**: Modal de navegación con secciones (adiso, mapa, publicar, chatbot, gratuitos)
- **Gestos**: Swipe para navegar entre anuncios

### Desktop

- **Grilla**: 4 columnas (base)
- **Sidebar**: Lateral derecho (420px, minimizable a 60px)
- **Modal**: Sidebar se expande automáticamente al seleccionar anuncio
- **Navegación**: Teclado (flechas) y botones

---

## 🔐 Autenticación y Usuarios

### Sistema de Roles

1. **usuario**: Usuario regular
2. **anunciante**: Usuario que publica anuncios
3. **admin**: Administrador del sistema

### Perfiles de Usuario

- **Profile básico**: email, nombre, apellido, teléfono, avatar, ubicación
- **Perfil Profesional**: Para usuarios que buscan empleo (título, experiencia, habilidades, educación, certificaciones)
- **Perfil de Negocio**: Para negocios (nombre, descripción, horarios, redes sociales, rating)

### Verificación

- Sistema de verificación de identidad, teléfono, email y negocio
- Estados: pendiente, en_revision, aprobado, rechazado
- Usuarios verificados tienen badge de verificación

---

## 📈 Analytics y Métricas

### Eventos Rastreados

- `busqueda`: Búsquedas realizadas
- `click`: Clicks en anuncios
- `favorito`: Anuncios marcados como favoritos
- `contacto`: Contactos realizados
- `publicacion`: Publicaciones de anuncios
- `visualizacion`: Visualizaciones de anuncios

### Tabla de Analytics

- `user_analytics`: Almacena todos los eventos
- Permite análisis de comportamiento de usuarios
- Datos anonimizados para privacidad

---

## 🌐 SEO y Accesibilidad

### SEO

- **Sitemap dinámico**: Generado automáticamente con todos los anuncios
- **Robots.txt**: Configurado para indexación
- **Structured Data**: JSON-LD para WebSite, CollectionPage, Product
- **Metadata**: Open Graph y Twitter Cards
- **Páginas de categorías**: Páginas dedicadas por categoría para SEO
- **Breadcrumbs**: Navegación con structured data

### Accesibilidad (WCAG 2.1 AA)

- **Navegación por teclado**: Completa
- **Screen readers**: Compatible con ARIA labels
- **Contraste**: Cumple estándares WCAG AA
- **Focus visible**: Indicadores de foco claros
- **Skip links**: Enlaces para saltar al contenido principal
- **Semántica HTML**: Uso correcto de elementos semánticos

---

## 🚧 Estado Actual y Roadmap

### Versión Actual: 2.3.0

**Últimas mejoras implementadas**:
- Modo oscuro con preferencias del sistema
- Prefetching de imágenes relacionadas
- Páginas dedicadas de categorías para SEO
- Sistema de ordenamiento visual
- Auditoría completa de accesibilidad, SEO, rendimiento y seguridad

### Historial de Versiones Principales

- **v2.3.0**: Modo oscuro, prefetching, páginas de categorías, ordenamiento
- **v2.2.0**: Auditoría completa (accesibilidad, SEO, rendimiento, seguridad)
- **v2.1.0**: Mejoras UX modal móvil y sidebar desktop
- **v2.0.0**: Sistema de paquetes de publicación
- **v1.0.0**: Lanzamiento inicial MVP

### Próximas Funcionalidades (Roadmap)

- Sistema de pagos integrado
- Notificaciones push
- Sistema de mensajería entre usuarios
- Sistema de calificaciones y reseñas
- Integración con redes sociales
- App móvil nativa
- API pública documentada
- Sistema de suscripciones para anunciantes

---

## 🔧 Scripts y Utilidades

### Scripts Disponibles

1. **extraer-texto-pdfs.ts**: Extrae texto de PDFs de revistas
2. **generar-prompts-llm.ts**: Genera prompts para LLMs
3. **consolidar-respuestas.ts**: Consolida respuestas de LLMs
4. **cargar-anuncios-masivo.ts**: Carga anuncios a la base de datos
5. **generar-toon.ts**: Genera formato TOON para búsquedas semánticas

### Guías

- `scripts/GUIA-PROCESO-COMPLETO.md`: Guía completa del proceso de digitalización
- `ANALISIS_NAMING.md`: Análisis de naming y estrategia de marca

---

## 📝 Notas Importantes

### Convenciones de Código

- **TypeScript estricto**: Todo el código está tipado
- **Componentes funcionales**: Uso de React hooks
- **Server Components**: Next.js 14 App Router con Server Components cuando es posible
- **Client Components**: Marcados con `'use client'` cuando necesitan interactividad

### Variables de Entorno

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_aqui
NEXT_PUBLIC_USE_LOCAL_STORAGE=false
NEXT_PUBLIC_SITE_URL=https://buscadis.com
NEXT_PUBLIC_ALLOWED_ORIGIN=https://buscadis.com
```

### Consideraciones de Rendimiento

- **Cache LRU**: Implementado en localStorage para anuncios
- **Lazy loading**: Imágenes con next/image
- **Code splitting**: Dynamic imports para componentes pesados
- **Paginación**: Scroll infinito con carga progresiva
- **Prefetching**: Imágenes de anuncios relacionados

### Consideraciones de Seguridad

- **RLS**: Row Level Security en todas las tablas
- **Validación**: Zod schemas en todas las rutas API
- **Sanitización**: Prevención de XSS
- **Rate limiting**: Por IP en endpoints críticos
- **CORS**: Configurado restrictivamente

---

## 🎯 Objetivos de Negocio

### Corto Plazo

1. Completar digitalización de anuncios históricos (~45,000 anuncios)
2. Implementar sistema de pagos
3. Aumentar base de usuarios en Cusco
4. Mejorar SEO y posicionamiento

### Mediano Plazo

1. Expansión a otras ciudades de Perú
2. Sistema de suscripciones para anunciantes frecuentes
3. App móvil nativa
4. Integración con redes sociales

### Largo Plazo

1. Expansión a Latinoamérica
2. Marketplace completo con transacciones
3. Sistema de verificación avanzado
4. API pública para integraciones

---

## 📞 Información de Contacto y Soporte

### Dominios

- **Producto**: buscadis.com
- **Holding**: adis.lat
- **Subdominio técnico**: market.adis.lat

### Feedback

- Sistema de feedback integrado en la plataforma
- Endpoint: `/api/feedback`
- Almacenamiento en Supabase

---

## 🔄 Actualizaciones del Documento

Este documento debe actualizarse cuando:
- Se agreguen nuevas funcionalidades importantes
- Cambie el modelo de negocio
- Se modifique la arquitectura técnica
- Se actualice el roadmap
- Cambien las estrategias de negocio

**Última actualización**: Enero 2025

---

## 📚 Recursos Adicionales

- **README.md**: Documentación técnica básica
- **scripts/GUIA-PROCESO-COMPLETO.md**: Guía del proceso de digitalización
- **ANALISIS_NAMING.md**: Análisis de naming y branding
- **app/progreso/page.tsx**: Changelog completo de versiones

---

*Este documento sirve como contexto completo para que LLMs entiendan el producto, la tecnología, el modelo de negocio y la visión de Buscadis/ADIS.lat.*

