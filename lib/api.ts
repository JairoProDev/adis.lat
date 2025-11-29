import { Aviso, AvisoGratuito } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export async function fetchAvisos(): Promise<Aviso[]> {
  try {
    const response = await fetch(`${API_URL}/avisos`, {
      cache: 'no-store', // Siempre obtener datos frescos
      next: { revalidate: 0 } // Sin caché para datos dinámicos
    });
    if (!response.ok) {
      throw new Error('Error al obtener avisos');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching avisos:', error);
    return [];
  }
}

export async function fetchAvisoById(id: string): Promise<Aviso | null> {
  try {
    const response = await fetch(`${API_URL}/avisos/${id}`, {
      cache: 'no-store',
      next: { revalidate: 0 }
    });
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error('Error al obtener aviso');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching aviso:', error);
    return null;
  }
}

export async function createAviso(aviso: Omit<Aviso, 'id' | 'fechaPublicacion' | 'horaPublicacion'> | Aviso): Promise<Aviso> {
  try {
    const response = await fetch(`${API_URL}/avisos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(aviso),
    });
    
    if (!response.ok) {
      // Intentar obtener el mensaje de error del servidor
      let errorMessage = 'Error al crear aviso';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        // Si no se puede parsear el error, usar el status
        errorMessage = `Error ${response.status}: ${response.statusText}`;
      }
      
      // Si el error es 409 (conflict), el aviso ya existe, intentar actualizar
      if (response.status === 409 && 'id' in aviso) {
        // Intentar actualizar en lugar de crear
        return await updateAviso(aviso as Aviso);
      }
      
      throw new Error(errorMessage);
    }
    
    const resultado = await response.json();
    return resultado;
  } catch (error: any) {
    console.error('Error creating aviso:', error);
    // Re-lanzar con más contexto
    throw error instanceof Error ? error : new Error(`Error al crear aviso: ${error?.message || 'Error desconocido'}`);
  }
}

export async function updateAviso(aviso: Aviso): Promise<Aviso> {
  try {
    const response = await fetch(`${API_URL}/avisos/${aviso.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(aviso),
    });
    if (!response.ok) {
      throw new Error('Error al actualizar aviso');
    }
    return await response.json();
  } catch (error) {
    console.error('Error updating aviso:', error);
    throw error;
  }
}

// Funciones para avisos gratuitos
export async function fetchAvisosGratuitos(): Promise<AvisoGratuito[]> {
  try {
    const response = await fetch(`${API_URL}/avisos-gratuitos`, {
      cache: 'no-store',
      next: { revalidate: 0 }
    });
    if (!response.ok) {
      throw new Error('Error al obtener avisos gratuitos');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching avisos gratuitos:', error);
    return [];
  }
}

export async function createAvisoGratuito(aviso: Omit<AvisoGratuito, 'id' | 'fechaCreacion' | 'fechaExpiracion'>): Promise<AvisoGratuito> {
  try {
    const response = await fetch(`${API_URL}/avisos-gratuitos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(aviso),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al crear aviso gratuito');
    }
    return await response.json();
  } catch (error) {
    console.error('Error creating aviso gratuito:', error);
    throw error;
  }
}

