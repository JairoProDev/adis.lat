/**
 * 🗃️ SISTEMA DE CACHÉ OFFLINE - Buscadis
 *
 * Infraestructura completa para almacenar datos en localStorage con:
 * - TTL (tiempo de vida)
 * - Versionado de caché
 * - Compresión de cache keys
 * - Estrategia stale-while-revalidate
 */

const CACHE_VERSION = 'v1';
const CACHE_PREFIX = `buscadis_cache_${CACHE_VERSION}_`;

// TTL por tipo de datos (en ms)
export const CACHE_TTL = {
  BUSINESS_PROFILE: 7 * 24 * 60 * 60 * 1000, // 7 días
  CATALOG_PRODUCTS: 7 * 24 * 60 * 60 * 1000,  // 7 días
  USER_PROFILE:     24 * 60 * 60 * 1000,       // 1 día
  ADISOS:           1 * 60 * 60 * 1000,         // 1 hora
  AUTH_SESSION:     7 * 24 * 60 * 60 * 1000,   // 7 días (misma vida que el token)
} as const;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  key: string;
}

/**
 * Guarda un dato en caché con TTL
 */
export function cacheSet<T>(key: string, data: T, ttl: number): void {
  if (typeof window === 'undefined') return;
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      key,
    };
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  } catch (e) {
    // Si localStorage está lleno, limpiar las entradas más antiguas
    console.warn('[Cache] Error escribiendo caché, intentando liberar espacio:', e);
    clearOldestEntries();
    try {
      const entry: CacheEntry<T> = { data, timestamp: Date.now(), ttl, key };
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
    } catch (e2) {
      console.error('[Cache] No se pudo guardar en caché:', e2);
    }
  }
}

/**
 * Lee un dato del caché. Retorna null si expiró o no existe.
 * @param allowStale Si true, retorna el dato aunque esté expirado (útil para offline)
 */
export function cacheGet<T>(key: string, allowStale = false): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;

    const entry: CacheEntry<T> = JSON.parse(raw);
    const age = Date.now() - entry.timestamp;

    if (!allowStale && age > entry.ttl) {
      // Expirado - limpiar
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }

    return entry.data;
  } catch (e) {
    return null;
  }
}

/**
 * Verifica si un dato existe en caché (y no expiró)
 */
export function cacheHas(key: string): boolean {
  return cacheGet(key) !== null;
}

/**
 * Verifica si un dato existe en caché (puede estar expirado pero sigue útil offline)
 */
export function cacheHasStale(key: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(CACHE_PREFIX + key) !== null;
  } catch {
    return false;
  }
}

/**
 * Obtiene la antigüedad de un dato en caché (en ms)
 */
export function cacheAge(key: string): number | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const entry = JSON.parse(raw);
    return Date.now() - entry.timestamp;
  } catch {
    return null;
  }
}

/**
 * Elimina un dato específico del caché
 */
export function cacheRemove(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(CACHE_PREFIX + key);
  } catch {}
}

/**
 * Limpia todo el caché de la aplicación
 */
export function cacheClear(): void {
  if (typeof window === 'undefined') return;
  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX));
    keys.forEach(k => localStorage.removeItem(k));
    console.log(`[Cache] Limpiadas ${keys.length} entradas`);
  } catch {}
}

/**
 * Elimina las entradas más antiguas del caché (estrategia LRU simple)
 */
function clearOldestEntries(): void {
  if (typeof window === 'undefined') return;
  try {
    const entries: { key: string; timestamp: number }[] = [];
    Object.keys(localStorage)
      .filter(k => k.startsWith(CACHE_PREFIX))
      .forEach(k => {
        try {
          const entry = JSON.parse(localStorage.getItem(k) || '{}');
          entries.push({ key: k, timestamp: entry.timestamp || 0 });
        } catch {}
      });

    // Ordenar por antigüedad y eliminar la mitad más vieja
    entries.sort((a, b) => a.timestamp - b.timestamp);
    entries.slice(0, Math.ceil(entries.length / 2)).forEach(e => {
      localStorage.removeItem(e.key);
    });
  } catch {}
}

// ============================================
// CLAVES DE CACHÉ TIPADAS
// ============================================

export const CacheKeys = {
  businessProfile: (slug: string) => `business_profile_${slug}`,
  businessCatalog: (businessId: string) => `business_catalog_${businessId}`,
  userProfile: (userId: string) => `user_profile_${userId}`,
  authSession: () => `auth_session`,
  adisos: (params: string) => `adisos_${params}`,
} as const;

// ============================================
// FUNCIONES DE ALTO NIVEL CON ESTRATEGIA SWR
// ============================================

interface FetchWithCacheOptions<T> {
  cacheKey: string;
  ttl: number;
  fetcher: () => Promise<T | null>;
  /**
   * Si true, se retorna inmediatamente el valor cacheado mientras se revalida en background.
   * Si false (default), solo retorna el valor si está fresco. Si expiró, intenta revalidar primero.
   */
  staleWhileRevalidate?: boolean;
  onRevalidated?: (data: T) => void;
}

/**
 * Estrategia Stale-While-Revalidate:
 * 1. Si hay caché fresco → retorna inmediatamente
 * 2. Si hay caché pero expiró + estamos offline → retorna el stale (mejor que nada)
 * 3. Si hay caché expirado + estamos online → retorna stale Y revalida en background
 * 4. Sin caché + online → fetch normal
 * 5. Sin caché + offline → retorna null
 */
export async function fetchWithCache<T>({
  cacheKey,
  ttl,
  fetcher,
  staleWhileRevalidate = true,
  onRevalidated,
}: FetchWithCacheOptions<T>): Promise<{ data: T | null; fromCache: boolean; isStale: boolean }> {
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  // 1. Intentar leer caché fresco
  const fresh = cacheGet<T>(cacheKey);
  if (fresh !== null) {
    // Tenemos caché fresco - revalidar en background si online
    if (isOnline && staleWhileRevalidate) {
      setTimeout(async () => {
        try {
          const newData = await fetcher();
          if (newData !== null) {
            cacheSet(cacheKey, newData, ttl);
            onRevalidated?.(newData);
          }
        } catch {}
      }, 0);
    }
    return { data: fresh, fromCache: true, isStale: false };
  }

  // 2. Intentar leer caché stale (expirado)
  const stale = cacheGet<T>(cacheKey, true /* allowStale */);

  if (!isOnline) {
    // Sin internet: retornar stale o null
    return { data: stale, fromCache: Boolean(stale), isStale: Boolean(stale) };
  }

  // 3. Tenemos stale + estamos online → retornar stale mientras revalidamos
  if (stale !== null && staleWhileRevalidate) {
    // Revalidar en background
    setTimeout(async () => {
      try {
        const newData = await fetcher();
        if (newData !== null) {
          cacheSet(cacheKey, newData, ttl);
          onRevalidated?.(newData);
        }
      } catch {}
    }, 0);
    return { data: stale, fromCache: true, isStale: true };
  }

  // 4. Sin caché + online → fetch
  try {
    const data = await fetcher();
    if (data !== null) {
      cacheSet(cacheKey, data, ttl);
    }
    return { data, fromCache: false, isStale: false };
  } catch (error) {
    // El fetch falló. Si tenemos stale, úsalo.
    if (stale !== null) {
      return { data: stale, fromCache: true, isStale: true };
    }
    return { data: null, fromCache: false, isStale: false };
  }
}
