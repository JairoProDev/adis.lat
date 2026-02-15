import { supabase } from './supabase';
import { Favorito, Adiso } from '@/types';

/**
 * Obtiene todos los favoritos de un usuario
 */
export async function getFavoritos(userId: string): Promise<Favorito[]> {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }

  const { data, error } = await supabase
    .from('favoritos')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    // Error 406 (Not Acceptable) generalmente es por RLS o permisos, no crítico
    if (error.message?.includes('406') || (error as any).status === 406 || (error as any).statusCode === 406) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Error 406 al obtener favoritos (posible problema de RLS):', error);
      }
      return [];
    }
    // Solo mostrar errores críticos en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.error('Error al obtener favoritos:', error);
    }
    throw error;
  }

  return (data || []) as Favorito[];
}

/**
 * Verifica si un adiso está en favoritos
 */
export async function esFavorito(userId: string, adisoId: string): Promise<boolean> {
  if (!supabase) {
    return false;
  }

  const { data, error } = await supabase
    .from('favoritos')
    .select('id')
    .eq('user_id', userId)
    .eq('adiso_id', adisoId)
    .maybeSingle();

  if (error) {
    if (error.code === 'PGRST116') {
      return false; // No encontrado = no es favorito
    }
    // Error 406 (Not Acceptable) generalmente es por RLS o permisos, no crítico
    if (error.message?.includes('406') || (error as any).status === 406 || (error as any).statusCode === 406) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Error 406 al verificar favorito (posible problema de RLS):', error);
      }
      return false;
    }
    // Solo mostrar errores críticos en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.error('Error al verificar favorito:', error);
    }
    return false;
  }

  return !!data;
}

/**
 * Agrega un adiso a favoritos
 */
export async function agregarFavorito(userId: string, adisoId: string): Promise<Favorito> {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }

  // Verificar si ya existe
  const yaEsFavorito = await esFavorito(userId, adisoId);
  if (yaEsFavorito) {
    // Si ya existe, obtenerlo y retornarlo
    const { data } = await supabase
      .from('favoritos')
      .select('*')
      .eq('user_id', userId)
      .eq('adiso_id', adisoId)
      .single();
    return data as Favorito;
  }

  const { data, error } = await supabase
    .from('favoritos')
    .insert({
      user_id: userId,
      adiso_id: adisoId
    })
    .select()
    .single();

  if (error) {
    console.error('Error al agregar favorito:', error);
    throw error;
  }

  return data as Favorito;
}

/**
 * Elimina un adiso de favoritos
 */
export async function eliminarFavorito(userId: string, adisoId: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }

  const { error } = await supabase
    .from('favoritos')
    .delete()
    .eq('user_id', userId)
    .eq('adiso_id', adisoId);

  if (error) {
    console.error('Error al eliminar favorito:', error);
    throw error;
  }
}

/**
 * Toggle favorito (agregar si no existe, eliminar si existe)
 */
export async function toggleFavorito(userId: string, adisoId: string): Promise<boolean> {
  const esFav = await esFavorito(userId, adisoId);

  if (esFav) {
    await eliminarFavorito(userId, adisoId);
    return false;
  } else {
    await agregarFavorito(userId, adisoId);
    return true;
  }
}

/**
 * Obtiene los adisos favoritos con sus datos completos
 * Nota: Esto requiere obtener los adisos desde la tabla adisos usando los IDs de favoritos
 */
export async function getAdisosFavoritos(userId: string): Promise<Adiso[]> {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }

  // Obtener IDs de favoritos
  const favoritos = await getFavoritos(userId);
  if (favoritos.length === 0) {
    return [];
  }

  const adisoIds = favoritos.map(f => f.adiso_id);

  // Obtener adisos desde la tabla adisos
  const { data, error } = await supabase
    .from('adisos')
    .select('*')
    .in('id', adisoIds);

  if (error) {
    console.error('Error al obtener adisos favoritos:', error);
    throw error;
  }

  // Convertir a formato Adiso
  const { dbToAdiso } = await import('./supabase');
  return (data || []).map((row: any) => dbToAdiso(row));
}



