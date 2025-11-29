import { Aviso } from '@/types';

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
      // Si el error es 409 (conflict), el aviso ya existe, intentar actualizar
      if (response.status === 409 && 'id' in aviso) {
        // Intentar actualizar en lugar de crear
        return await updateAviso(aviso as Aviso);
      }
      throw new Error('Error al crear aviso');
    }
    return await response.json();
  } catch (error) {
    console.error('Error creating aviso:', error);
    throw error;
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

