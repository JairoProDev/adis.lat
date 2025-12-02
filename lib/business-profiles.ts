import { supabase } from './supabase';
import { PerfilNegocio, HorarioAtencion, RedesSociales } from '@/types';

/**
 * Obtiene los perfiles de negocios de un usuario
 */
export async function getPerfilesNegocios(userId: string): Promise<PerfilNegocio[]> {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }

  const { data, error } = await supabase
    .from('perfiles_negocios')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    if (error.code === 'PGRST205') {
      return []; // Tabla no existe aún
    }
    console.error('Error al obtener perfiles de negocios:', error);
    throw error;
  }

  return (data || []) as PerfilNegocio[];
}

/**
 * Obtiene un perfil de negocio por ID
 */
export async function getPerfilNegocio(negocioId: string): Promise<PerfilNegocio | null> {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }

  const { data, error } = await supabase
    .from('perfiles_negocios')
    .select('*')
    .eq('id', negocioId)
    .single();

  if (error) {
    if (error.code === 'PGRST116' || error.code === 'PGRST205') {
      return null; // No encontrado o tabla no existe
    }
    console.error('Error al obtener perfil de negocio:', error);
    throw error;
  }

  return data as PerfilNegocio;
}

/**
 * Crea un nuevo perfil de negocio
 */
export async function crearPerfilNegocio(
  userId: string,
  datos: Omit<PerfilNegocio, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'rating_promedio' | 'total_calificaciones' | 'es_verificado'>
): Promise<PerfilNegocio> {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }

  const { data, error } = await supabase
    .from('perfiles_negocios')
    .insert({
      user_id: userId,
      ...datos,
      es_verificado: false,
      rating_promedio: 0,
      total_calificaciones: 0
    })
    .select()
    .single();

  if (error) {
    console.error('Error al crear perfil de negocio:', error);
    throw error;
  }

  return data as PerfilNegocio;
}

/**
 * Actualiza un perfil de negocio
 */
export async function actualizarPerfilNegocio(
  negocioId: string,
  userId: string,
  datos: Partial<Omit<PerfilNegocio, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'rating_promedio' | 'total_calificaciones' | 'es_verificado'>>
): Promise<PerfilNegocio> {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }

  const { data, error } = await supabase
    .from('perfiles_negocios')
    .update(datos)
    .eq('id', negocioId)
    .eq('user_id', userId) // Asegurar que solo el dueño puede actualizar
    .select()
    .single();

  if (error) {
    console.error('Error al actualizar perfil de negocio:', error);
    throw error;
  }

  return data as PerfilNegocio;
}

/**
 * Obtiene perfiles de negocios públicos (para búsqueda)
 */
export async function getPerfilesNegociosPublicos(
  filtros?: {
    categoria?: string;
    es_verificado?: boolean;
    limit?: number;
  }
): Promise<PerfilNegocio[]> {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }

  let query = supabase
    .from('perfiles_negocios')
    .select('*');

  if (filtros?.categoria) {
    query = query.eq('categoria', filtros.categoria);
  }

  if (filtros?.es_verificado !== undefined) {
    query = query.eq('es_verificado', filtros.es_verificado);
  }

  if (filtros?.limit) {
    query = query.limit(filtros.limit);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    if (error.code === 'PGRST205') {
      return []; // Tabla no existe aún
    }
    console.error('Error al obtener perfiles de negocios:', error);
    throw error;
  }

  return (data || []) as PerfilNegocio[];
}





