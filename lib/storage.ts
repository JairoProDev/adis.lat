import { Aviso } from '@/types';

const STORAGE_KEY = 'buscadis_avisos';

// Por defecto usa localStorage. Cambiar a false para usar API/Supabase
const USE_LOCAL_STORAGE = process.env.NEXT_PUBLIC_USE_LOCAL_STORAGE === 'true';

// Funciones que funcionan con localStorage (desarrollo)
const getAvisosLocal = (): Aviso[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

const saveAvisoLocal = (aviso: Aviso): void => {
  if (typeof window === 'undefined') return;
  const avisos = getAvisosLocal();
  // Prevenir duplicados: verificar si ya existe
  const existe = avisos.find(a => a.id === aviso.id);
  if (!existe) {
    avisos.unshift(aviso);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(avisos));
  } else {
    // Si existe, actualizarlo en lugar de duplicarlo
    const index = avisos.findIndex(a => a.id === aviso.id);
    if (index >= 0) {
      avisos[index] = aviso;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(avisos));
    }
  }
};

const getAvisoByIdLocal = (id: string): Aviso | null => {
  const avisos = getAvisosLocal();
  return avisos.find(a => a.id === id) || null;
};

// Obtener solo cache (instantáneo)
export const getAvisosCache = (): Aviso[] => {
  return getAvisosLocal();
};

// Funciones públicas que eligen entre localStorage o API
export const getAvisos = async (): Promise<Aviso[]> => {
  if (USE_LOCAL_STORAGE) {
    return getAvisosLocal();
  }
  
  // Si no usa localStorage, cargar desde API
  if (typeof window !== 'undefined') {
    try {
      const { fetchAvisos } = await import('./api');
      const avisosDesdeAPI = await fetchAvisos();
      
      // Actualizar cache con datos frescos
      if (avisosDesdeAPI.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(avisosDesdeAPI));
      }
      
      return avisosDesdeAPI;
    } catch (error) {
      console.error('Error al cargar desde API, usando localStorage:', error);
      return getAvisosLocal();
    }
  }
  
  return [];
};

export const saveAviso = async (aviso: Aviso): Promise<void> => {
  // Guardar en cache inmediatamente (optimistic update)
  saveAvisoLocal(aviso);
  
  if (USE_LOCAL_STORAGE) {
    return;
  }
  
  // Si el aviso tiene imágenes con previews locales (data:image), NO guardar en API todavía
  // Solo guardar cuando tenga URLs reales de Supabase
  const tienePreviewsLocales = aviso.imagenesUrls?.some(url => url.startsWith('data:image'));
  if (tienePreviewsLocales) {
    // No guardar en API todavía, esperar a que las imágenes se suban
    return;
  }
  
  // Guardar en API en background
  if (typeof window !== 'undefined') {
    try {
      const { createAviso, updateAviso } = await import('./api');
      // Intentar crear, si falla por duplicado, actualizar
      try {
        await createAviso(aviso);
      } catch (error: any) {
        // Si el error es 409 (conflict) o el aviso ya existe, actualizar
        if (error?.message?.includes('ya existe') || error?.message?.includes('duplicado')) {
          await updateAviso(aviso);
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error('Error al guardar en API:', error);
      // Ya está en cache, así que está bien
    }
  }
};

export const getAvisoById = async (id: string): Promise<Aviso | null> => {
  // Primero buscar en cache (instantáneo)
  const cacheAviso = getAvisoByIdLocal(id);
  
  if (USE_LOCAL_STORAGE) {
    return cacheAviso;
  }
  
  // Si no está en cache, cargar desde API
  if (typeof window !== 'undefined') {
    try {
      const { fetchAvisoById } = await import('./api');
      const aviso = await fetchAvisoById(id);
      if (aviso) {
        // Guardar en cache para próxima vez
        const avisos = getAvisosLocal();
        if (!avisos.find(a => a.id === id)) {
          avisos.unshift(aviso);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(avisos));
        }
      }
      return aviso || cacheAviso;
    } catch (error) {
      console.error('Error al cargar desde API:', error);
      return cacheAviso;
    }
  }
  
  return cacheAviso;
};
