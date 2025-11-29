import { Aviso } from '@/types';

const STORAGE_KEY = 'buscadis_avisos';

// Por defecto usa localStorage. Cambiar a false para usar API/Supabase
const USE_LOCAL_STORAGE = process.env.NEXT_PUBLIC_USE_LOCAL_STORAGE === 'true';

// Funciones que funcionan con localStorage (desarrollo)
const getAvisosLocal = (): Aviso[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error al leer localStorage:', error);
    // Si hay error, limpiar y empezar de nuevo
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignorar errores al limpiar
    }
    return [];
  }
};

const saveAvisoLocal = (aviso: Aviso): void => {
  if (typeof window === 'undefined') return;
  try {
    const avisos = getAvisosLocal();
    // Prevenir duplicados: verificar si ya existe
    const existe = avisos.find(a => a.id === aviso.id);
    if (!existe) {
      avisos.unshift(aviso);
    } else {
      // Si existe, actualizarlo en lugar de duplicarlo
      const index = avisos.findIndex(a => a.id === aviso.id);
      if (index >= 0) {
        avisos[index] = aviso;
      }
    }

    // Limitar el número de avisos en localStorage para evitar exceder la cuota
    // Mantener solo los últimos 50 avisos
    const avisosLimitados = avisos.slice(0, 50);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(avisosLimitados));
  } catch (error: any) {
    // Si hay error de cuota, limpiar y guardar solo el nuevo aviso
    if (error?.name === 'QuotaExceededError' || error?.message?.includes('quota')) {
      console.warn('LocalStorage lleno, limpiando y guardando solo el nuevo aviso');
      try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.setItem(STORAGE_KEY, JSON.stringify([aviso]));
      } catch (cleanError) {
        console.error('Error al limpiar localStorage:', cleanError);
        // Si aún falla, no hacer nada (el aviso se guardará en Supabase)
      }
    } else {
      console.error('Error al guardar en localStorage:', error);
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
  
  // IMPORTANTE: Guardar en API INMEDIATAMENTE, incluso con previews locales
  // Esto asegura que el aviso exista en Supabase y no desaparezca al recargar
  // Las imágenes se actualizarán cuando se suban a Supabase Storage
  if (typeof window !== 'undefined') {
    try {
      const { createAviso, updateAviso } = await import('./api');
      // Intentar crear, si falla por duplicado, actualizar
      try {
        const resultado = await createAviso(aviso);
        console.log('✅ Aviso guardado en Supabase:', resultado.id);
      } catch (error: any) {
        // Si el error es 409 (conflict) o el aviso ya existe, actualizar
        if (error?.message?.includes('ya existe') || error?.message?.includes('duplicado') || error?.response?.status === 409) {
          const resultado = await updateAviso(aviso);
          console.log('✅ Aviso actualizado en Supabase:', resultado.id);
        } else {
          // Re-lanzar el error para que se maneje arriba
          throw error;
        }
      }
    } catch (error: any) {
      // Log detallado del error
      console.error('❌ Error al guardar en API:', error);
      console.error('Detalles del error:', {
        message: error?.message,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        avisoId: aviso.id,
        avisoTitulo: aviso.titulo
      });
      
      // Lanzar el error para que el componente pueda manejarlo
      // Esto es importante para que el usuario sepa que hubo un problema
      throw new Error(`Error al guardar aviso en Supabase: ${error?.message || 'Error desconocido'}`);
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
