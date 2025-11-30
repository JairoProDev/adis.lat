import { Adiso, AdisoGratuito } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export async function fetchAdisos(page: number = 1, limit: number = 1000): Promise<Adiso[]> {
  try {
    const response = await fetch(`${API_URL}/adisos?page=${page}&limit=${limit}`, {
      cache: 'no-store', // Siempre obtener datos frescos
      next: { revalidate: 0 } // Sin caché para datos dinámicos
    });
    if (!response.ok) {
      throw new Error('Error al obtener adisos');
    }
    const data = await response.json();
    // Manejar respuesta paginada o lista directa (compatibilidad hacia atrás)
    return Array.isArray(data) ? data : (data.data || []);
  } catch (error) {
    console.error('Error fetching adisos:', error);
    return [];
  }
}

export async function fetchAdisoById(id: string): Promise<Adiso | null> {
  try {
    const response = await fetch(`${API_URL}/adisos/${id}`, {
      cache: 'no-store',
      next: { revalidate: 0 }
    });
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error('Error al obtener adiso');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching adiso:', error);
    return null;
  }
}

export async function createAdiso(adiso: Omit<Adiso, 'id' | 'fechaPublicacion' | 'horaPublicacion'> | Adiso): Promise<Adiso> {
  try {
    const response = await fetch(`${API_URL}/adisos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(adiso),
    });
    
    if (!response.ok) {
      // Intentar obtener el mensaje de error del servidor
      let errorMessage = 'Error al crear adiso';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        // Si no se puede parsear el error, usar el status
        errorMessage = `Error ${response.status}: ${response.statusText}`;
      }
      
      // Si el error es 409 (conflict), el adiso ya existe, intentar actualizar
      if (response.status === 409 && 'id' in adiso) {
        // Intentar actualizar en lugar de crear
        return await updateAdiso(adiso as Adiso);
      }
      
      throw new Error(errorMessage);
    }
    
    const resultado = await response.json();
    return resultado;
  } catch (error: any) {
    console.error('Error creating adiso:', error);
    // Re-lanzar con más contexto
    throw error instanceof Error ? error : new Error(`Error al crear adiso: ${error?.message || 'Error desconocido'}`);
  }
}

export async function updateAdiso(adiso: Adiso): Promise<Adiso> {
  try {
    const response = await fetch(`${API_URL}/adisos/${adiso.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(adiso),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Error al actualizar adiso');
    }
    return await response.json();
  } catch (error) {
    console.error('Error updating adiso:', error);
    throw error;
  }
}

export async function deleteAdiso(id: string): Promise<void> {
  try {
    const response = await fetch(`${API_URL}/adisos/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Error al eliminar adiso');
    }
  } catch (error) {
    console.error('Error deleting adiso:', error);
    throw error;
  }
}

// Funciones para adisos gratuitos
export async function fetchAdisosGratuitos(): Promise<AdisoGratuito[]> {
  try {
    const response = await fetch(`${API_URL}/adisos-gratuitos`, {
      cache: 'no-store',
      next: { revalidate: 0 }
    });
    if (!response.ok) {
      throw new Error('Error al obtener adisos gratuitos');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching adisos gratuitos:', error);
    return [];
  }
}

export async function createAdisoGratuito(adiso: Omit<AdisoGratuito, 'id' | 'fechaCreacion' | 'fechaExpiracion'>): Promise<AdisoGratuito> {
  try {
    const response = await fetch(`${API_URL}/adisos-gratuitos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(adiso),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al crear adiso gratuito');
    }
    return await response.json();
  } catch (error) {
    console.error('Error creating adiso gratuito:', error);
    throw error;
  }
}

