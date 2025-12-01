import { supabase } from './supabase';
import { PerfilProfesional, Educacion, ExperienciaLaboral, Certificacion } from '@/types';

/**
 * Obtiene el perfil profesional de un usuario
 */
export async function getPerfilProfesional(userId: string): Promise<PerfilProfesional | null> {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }

  const { data, error } = await supabase
    .from('perfiles_profesionales')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116' || error.code === 'PGRST205') {
      return null; // No encontrado o tabla no existe
    }
    console.error('Error al obtener perfil profesional:', error);
    throw error;
  }

  return data as PerfilProfesional;
}

/**
 * Crea o actualiza el perfil profesional de un usuario
 */
export async function upsertPerfilProfesional(
  userId: string,
  datos: Partial<Omit<PerfilProfesional, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<PerfilProfesional> {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }

  // Verificar si ya existe
  const existente = await getPerfilProfesional(userId);

  if (existente) {
    // Actualizar
    const { data, error } = await supabase
      .from('perfiles_profesionales')
      .update(datos)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error al actualizar perfil profesional:', error);
      throw error;
    }

    return data as PerfilProfesional;
  } else {
    // Crear
    const { data, error } = await supabase
      .from('perfiles_profesionales')
      .insert({
        user_id: userId,
        ...datos
      })
      .select()
      .single();

    if (error) {
      console.error('Error al crear perfil profesional:', error);
      throw error;
    }

    return data as PerfilProfesional;
  }
}

/**
 * Obtiene perfiles profesionales públicos (para búsqueda de empleos)
 */
export async function getPerfilesProfesionalesPublicos(
  filtros?: {
    disponibilidad?: 'disponible' | 'busco_empleo' | 'no_disponible';
    habilidades?: string[];
    limit?: number;
  }
): Promise<PerfilProfesional[]> {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }

  let query = supabase
    .from('perfiles_profesionales')
    .select('*');

  if (filtros?.disponibilidad) {
    query = query.eq('disponibilidad', filtros.disponibilidad);
  }

  if (filtros?.habilidades && filtros.habilidades.length > 0) {
    query = query.contains('habilidades', filtros.habilidades);
  }

  if (filtros?.limit) {
    query = query.limit(filtros.limit);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    if (error.code === 'PGRST205') {
      return []; // Tabla no existe aún
    }
    console.error('Error al obtener perfiles profesionales:', error);
    throw error;
  }

  return (data || []) as PerfilProfesional[];
}


