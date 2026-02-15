# Optimización del Sistema de Favoritos

## Problema Identificado

### 1. Error 406 (Not Acceptable)
- **Causa**: El código usaba `.single()` en Supabase para verificar si un anuncio era favorito
- **Consecuencia**: Cuando el anuncio NO era favorito, la base de datos devolvía 0 resultados, pero se esperaba exactamente 1, generando error 406
- **Frecuencia**: Ocurría para CADA anuncio visible en la pantalla (50+ errores simultáneos)

### 2. Consultas Excesivas a la Base de Datos
- **Problema**: Cada tarjeta de anuncio hacía una petición individual para verificar si era favorito
- **Ejemplo**: Con 50 anuncios en pantalla = 50 peticiones a Supabase
- **Impacto**:
  - Consumo innecesario de recursos
  - Lentitud en la carga
  - Exceso de tráfico de red
  - Posibles límites de rate limiting

### 3. Código Extraño en Google OAuth
- **Qué era**: `qegqjshtxotdjjhvxmve` es el ID de tu proyecto en Supabase
- **Por qué aparece**: En el plan gratuito, la URL es `https://[project-id].supabase.co`
- **Cuándo se muestra**: Durante la redirección de Google OAuth

## Soluciones Implementadas

### 1. Corrección del Error 406 ✅
**Archivo**: `lib/favoritos.ts`

**Cambio**:
```typescript
// ANTES
.eq('adiso_id', adisoId)
.single();

// DESPUÉS
.eq('adiso_id', adisoId)
.maybeSingle();
```

**Resultado**: `.maybeSingle()` devuelve `null` si no encuentra resultados, en lugar de lanzar error

---

### 2. Sistema Centralizado de Favoritos ✅

#### A. Nuevo Context (`FavoritosContext.tsx`)
- **Ubicación**: `contexts/FavoritosContext.tsx`
- **Función**: Gestionar TODOS los favoritos del usuario en un solo lugar
- **Características**:
  - **Lazy Loading**: Solo carga favoritos cuando se necesitan (primera interacción)
  - **Single Query**: 1 petición en total (obtiene todos los IDs de favoritos)
  - **Estado en Memoria**: Las tarjetas consultan Set en RAM, no la BD
  - **Optimistic Updates**: Actualiza UI instantáneamente, sincroniza con BD después
  - **Soporte para invitados**: Usa localStorage para usuarios no autenticados

#### B. Hook Refactorizado (`useAdInteraction.ts`)
**Cambios principales**:
```typescript
// ANTES: Cada tarjeta hacía su propia petición
const fav = await esFavorito(user.id, adisoId);
setIsFavorite(fav);

// DESPUÉS: Consulta el contexto en memoria
const { isFavorite: checkIsFavorite, toggleFavorite } = useFavoritos();
return { isFavorite: checkIsFavorite(adisoId), ... };
```

**Eliminado**:
- ❌ `useEffect` que cargaba estado inicial (causaba las 50 peticiones)
- ❌ Llamadas individuales a `esFavorito()`
- ❌ Estado local `isFavorite` (ahora lo maneja el contexto)

**Agregado**:
- ✅ Integración con `FavoritosContext`
- ✅ Verificación instantánea en memoria

#### C. Componente FavoritosList Actualizado
**Cambios**:
```typescript
// ANTES: Petición por favorito + petición por cada anuncio
const favoritosData = await getFavoritos(user.id);
const adisosPromises = favoritosData.map(f => getAdiso(f.adiso_id));

// DESPUÉS: 1 petición para IDs + peticiones para adisos
await loadFavorites(); // Solo carga si no está ya cargado
const adisosPromises = Array.from(favoritosIds).map(id => getAdiso(id));
```

#### D. Integración en Layout
**Archivo**: `app/layout.tsx`

```tsx
<AuthProvider>
  <FavoritosProvider>  {/* <-- Nuevo provider */}
    <UIProvider>
      {children}
    </UIProvider>
  </FavoritosProvider>
</AuthProvider>
```

**Ubicación**: Dentro de `AuthProvider` (necesita acceso al usuario)

---

### 3. Solución para Código de Google (Informativo)

**Opciones**:

#### Opción 1: Custom Domain (Solución Profesional)
- Requiere plan Pro de Supabase (~$25/mes)
- Configurar DNS con CNAME apuntando a Supabase
- Resultado: `auth.tudominio.com` en lugar de `qegqjshtxotdjjhvxmve.supabase.co`

#### Opción 2: Branding en Google Console (Rápido y Gratis)
1. Ir a Google Cloud Console → OAuth consent screen
2. Configurar:
   - **App name**: "Buscadis" o el nombre de tu app
   - **App logo**: Tu logo oficial
   - **Support email**: email@tudominio.com
3. Resultado: El usuario ve "Buscadis quiere acceder..." con tu logo

---

## Comparación de Rendimiento

### ANTES:
```
Usuario carga página con 50 anuncios
├─ 50 peticiones a /favoritos?select=id&user_id=eq.XXX&adiso_id=eq.YYY (1 por tarjeta)
├─ Tiempo: ~2-5 segundos
├─ Tráfico: Alto
└─ Errores: 50+ errores 406 en consola
```

### DESPUÉS:
```
Usuario carga página con 50 anuncios
├─ 0 peticiones (lazy loading)
├─ Tiempo: Instantáneo
├─ Tráfico: Cero
└─ Errores: Ninguno

Usuario hace clic en ⭐ (primera vez)
├─ 1 petición a /favoritos?select=adiso_id&user_id=eq.XXX
├─ Carga TODOS los favoritos del usuario
├─ Los guarda en memoria (Set<string>)
└─ Futuras verificaciones: instantáneas (consulta en RAM)

Usuario entra a "Mis Favoritos"
├─ 1 petición si no estaba cargado (reutiliza si ya estaba)
└─ N peticiones para obtener detalles completos de cada anuncio favorito
```

---

## Beneficios de la Implementación

### 1. **Rendimiento**
- ✅ Reducción de 50+ peticiones → 1 petición (o 0 en carga inicial)
- ✅ Verificación instantánea de favoritos (consulta en RAM)
- ✅ Sin bloqueos ni esperas al cargar anuncios

### 2. **Experiencia de Usuario**
- ✅ Carga más rápida de la página principal
- ✅ Sin errores visibles en consola
- ✅ Interacción fluida con botones de favoritos
- ✅ Actualizaciones optimistas (UI responde antes de confirmar con servidor)

### 3. **Costos y Escalabilidad**
- ✅ Menor consumo de recursos en Supabase
- ✅ Menor tráfico de red
- ✅ Respeta límites de rate limiting
- ✅ Preparado para escalar (no importa si hay 10 o 1000 anuncios visibles)

### 4. **Arquitectura**
- ✅ Código más limpio y centralizado
- ✅ Single Source of Truth (contexto único)
- ✅ Fácil de mantener y extender
- ✅ Separación de responsabilidades

---

## Archivos Modificados

1. **`lib/favoritos.ts`**
   - Cambiado `.single()` → `.maybeSingle()`

2. **`contexts/FavoritosContext.tsx`** (NUEVO)
   - Context para gestión centralizada de favoritos
   - Lazy loading con 1 petición total
   - Soporte para autenticados e invitados

3. **`hooks/useAdInteraction.ts`**
   - Refactorizado para usar `FavoritosContext`
   - Eliminadas peticiones individuales
   - Verificación en memoria

4. **`components/FavoritosList.tsx`**
   - Integrado con `FavoritosContext`
   - Carga favoritos al abrir panel (no antes)

5. **`app/layout.tsx`**
   - Agregado `FavoritosProvider` al árbol de contextos

---

## Filosofía de la Solución

> **"Don't load what you don't need, when you don't need it"**

- **Lazy**: Solo carga favoritos cuando el usuario interactúa
- **Centralized**: Un solo lugar maneja el estado
- **Cached**: Guarda en memoria para consultas instantáneas
- **Optimistic**: UI actualiza antes de confirmar con servidor
- **Resilient**: Maneja errores y revierte si falla

---

## Testing Recomendado

1. **Verificar consola limpia**:
   - Cargar página principal
   - No debe haber errores 406

2. **Verificar lazy loading**:
   - Abrir DevTools → Network
   - Cargar página → 0 peticiones a `/favoritos`
   - Hacer clic en ⭐ → 1 petición total
   - Hacer clic en otro ⭐ → 0 peticiones nuevas

3. **Verificar UI optimista**:
   - Clic en ⭐ → debe cambiar a rojo instantáneamente
   - Desconectar internet momentáneamente
   - Clic en ⭐ → debe cambiar, luego revertir si falla

4. **Verificar para invitados**:
   - Cerrar sesión
   - Clic en ⭐ → guarda en localStorage
   - Clic en ⭐ otra vez → lee de localStorage
   - Muestra modal de login

---

## Próximas Mejoras Sugeridas

1. **Sincronización de localStorage → BD**
   - Al iniciar sesión, migrar favoritos guardados localmente

2. **Prefetch inteligente**
   - Si el usuario está autenticado y hace scroll, cargar favoritos en background

3. **Cache con expiración**
   - Recargar favoritos cada X minutos para mantener sincronizado

4. **Analytics**
   - Rastrear qué tipo de anuncios le gustan al usuario
   - Mejorar recomendaciones basadas en favoritos
