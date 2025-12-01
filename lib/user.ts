import { supabase } from './supabase';
import { Profile, UserPreferences, Favorito } from '@/types';

/**
 * Obtiene el perfil de un usuario
 */
export async function getProfile(userId: string): Promise<Profile | null> {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Perfil no encontrado
    }
    console.error('Error al obtener perfil:', error);
    throw error;
  }

  return data as Profile;
}

/**
 * Actualiza el perfil de un usuario
 */
export async function updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile> {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error al actualizar perfil:', error);
    throw error;
  }

  return data as Profile;
}

/**
 * Obtiene las preferencias de un usuario
 */
export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }

  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Crear preferencias por defecto si no existen
      return await createDefaultPreferences(userId);
    }
    console.error('Error al obtener preferencias:', error);
    throw error;
  }

  return data as UserPreferences;
}

/**
 * Crea preferencias por defecto para un usuario
 */
async function createDefaultPreferences(userId: string): Promise<UserPreferences> {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }

  const defaultPreferences: Omit<UserPreferences, 'id' | 'created_at' | 'updated_at'> = {
    user_id: userId,
    categorias_favoritas: [],
    notificaciones_email: true,
    notificaciones_push: false,
    idioma: 'es',
    tema: 'auto',
    radio_busqueda_km: 10
  };

  const { data, error } = await supabase
    .from('user_preferences')
    .insert(defaultPreferences)
    .select()
    .single();

  if (error) {
    console.error('Error al crear preferencias:', error);
    throw error;
  }

  return data as UserPreferences;
}

/**
 * Actualiza las preferencias de un usuario
 */
export async function updateUserPreferences(
  userId: string,
  updates: Partial<UserPreferences>
): Promise<UserPreferences> {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }

  // Asegurar que existan las preferencias
  await getUserPreferences(userId);

  const { data, error } = await supabase
    .from('user_preferences')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error al actualizar preferencias:', error);
    throw error;
  }

  return data as UserPreferences;
}

/**
 * Actualiza la ubicación del usuario
 */
export async function updateUserLocation(
  userId: string,
  ubicacion: string,
  latitud?: number,
  longitud?: number
): Promise<Profile> {
  return updateProfile(userId, {
    ubicacion,
    latitud,
    longitud
  });
}

/**
 * Cambia el rol de un usuario (solo admins)
 */
export async function updateUserRole(
  userId: string,
  nuevoRol: 'usuario' | 'anunciante' | 'admin'
): Promise<Profile> {
  return updateProfile(userId, { rol: nuevoRol });
}

