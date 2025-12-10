import { supabase } from './supabase';
import { Verificacion, TipoVerificacion, EstadoVerificacion } from '@/types';

/**
 * Crea una solicitud de verificación
 */
export async function crearSolicitudVerificacion(
  userId: string,
  tipo: TipoVerificacion,
  documentoUrl?: string,
  datosVerificacion?: Record<string, any>
): Promise<Verificacion> {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }

  const { data, error } = await supabase
    .from('verificaciones')
    .insert({
      user_id: userId,
      tipo,
      estado: 'pendiente',
      documento_url: documentoUrl,
      datos_verificacion: datosVerificacion || {}
    })
    .select()
    .single();

  if (error) {
    console.error('Error al crear solicitud de verificación:', error);
    throw error;
  }

  return data as Verificacion;
}

/**
 * Obtiene las verificaciones de un usuario
 */
export async function getVerificaciones(userId: string): Promise<Verificacion[]> {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }

  const { data, error } = await supabase
    .from('verificaciones')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    if (error.code === 'PGRST205') {
      return []; // Tabla no existe aún
    }
    console.error('Error al obtener verificaciones:', error);
    throw error;
  }

  return (data || []) as Verificacion[];
}

/**
 * Verifica si un usuario tiene una verificación aprobada de un tipo específico
 */
export async function tieneVerificacionAprobada(
  userId: string,
  tipo: TipoVerificacion
): Promise<boolean> {
  if (!supabase) {
    return false;
  }

  try {
    const { data, error } = await supabase
      .from('verificaciones')
      .select('id')
      .eq('user_id', userId)
      .eq('tipo', tipo)
      .eq('estado', 'aprobado')
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116' || error.code === 'PGRST205') {
        return false; // No encontrado o tabla no existe
      }
      throw error;
    }

    return !!data;
  } catch (error: any) {
    if (error.code === 'PGRST205') {
      return false;
    }
    console.error('Error al verificar estado de verificación:', error);
    return false;
  }
}











