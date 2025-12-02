import { supabase } from './supabase';
import { TipoEventoAnalytics } from '@/types';

/**
 * Registra un evento de analytics
 */
export async function registrarEvento(
  userId: string | undefined,
  tipo: TipoEventoAnalytics,
  evento: string,
  datos: Record<string, any> = {}
) {
  if (!supabase) {
    // En desarrollo, solo loguear
    console.log('[Analytics]', tipo, evento, datos);
    return;
  }

  try {
    await supabase.from('user_analytics').insert({
      user_id: userId || null,
      tipo_evento: tipo,
      evento,
      datos
    });
  } catch (error: any) {
    // Si la tabla no existe aún (PGRST205), no es crítico
    if (error?.code !== 'PGRST205') {
      console.error('Error al registrar evento de analytics:', error);
    }
  }
}

/**
 * Registra una búsqueda
 */
export function registrarBusqueda(userId: string | undefined, termino: string, resultados: number) {
  return registrarEvento(userId, 'busqueda', 'busqueda_realizada', {
    termino,
    resultados
  });
}

/**
 * Registra un click en un adiso
 */
export function registrarClick(userId: string | undefined, adisoId: string, categoria: string) {
  return registrarEvento(userId, 'click', 'click_adiso', {
    adiso_id: adisoId,
    categoria
  });
}

/**
 * Registra que se agregó a favoritos
 */
export function registrarFavorito(userId: string | undefined, adisoId: string) {
  return registrarEvento(userId, 'favorito', 'favorito_agregado', {
    adiso_id: adisoId
  });
}

/**
 * Registra un contacto (click en WhatsApp)
 */
export function registrarContacto(userId: string | undefined, adisoId: string, categoria: string) {
  return registrarEvento(userId, 'contacto', 'contacto_whatsapp', {
    adiso_id: adisoId,
    categoria
  });
}

/**
 * Registra una visualización de adiso
 */
export function registrarVisualizacion(userId: string | undefined, adisoId: string, duracionSegundos?: number) {
  return registrarEvento(userId, 'visualizacion', 'adiso_visto', {
    adiso_id: adisoId,
    duracion_segundos: duracionSegundos
  });
}





