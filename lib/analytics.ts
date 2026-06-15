import { supabase } from './supabase';
import { TipoEventoAnalytics } from '@/types';
import { trackEvent } from '@/lib/events';

/**
 * Registra un evento de analytics (legacy user_analytics + behavioral_events)
 */
export async function registrarEvento(
  userId: string | undefined,
  tipo: TipoEventoAnalytics,
  evento: string,
  datos: Record<string, unknown> = {}
) {
  if (supabase) {
    try {
      await supabase.from('user_analytics').insert({
        user_id: userId || null,
        tipo_evento: tipo,
        evento,
        datos,
      });
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code;
      if (code !== 'PGRST205') {
        console.error('Error al registrar evento de analytics:', error);
      }
    }
  }
}

/**
 * Registra una búsqueda
 */
export function registrarBusqueda(userId: string | undefined, termino: string, resultados: number) {
  trackEvent('search.performed', {
    entityType: 'search',
    entityId: termino.slice(0, 200),
    payload: { termino, resultados },
    userId: userId ?? null,
  });
  return registrarEvento(userId, 'busqueda', 'busqueda_realizada', { termino, resultados });
}

/**
 * Registra un click en un adiso
 */
export function registrarClick(userId: string | undefined, adisoId: string, categoria: string) {
  trackEvent('ad.click', {
    entityType: 'adiso',
    entityId: adisoId,
    payload: { categoria },
    userId: userId ?? null,
  });
  return registrarEvento(userId, 'click', 'click_adiso', { adiso_id: adisoId, categoria });
}

/**
 * Registra que se agregó a favoritos
 */
export function registrarFavorito(userId: string | undefined, adisoId: string, categoria?: string) {
  trackEvent('ad.favorite', {
    entityType: 'adiso',
    entityId: adisoId,
    payload: { categoria },
    userId: userId ?? null,
  });
  return registrarEvento(userId, 'favorito', 'favorito_agregado', { adiso_id: adisoId });
}

/**
 * Registra un contacto (click en WhatsApp) e incrementa el contador
 */
export async function registrarContacto(
  userId: string | undefined,
  adisoId: string,
  categoria: string,
  channel: 'whatsapp' | 'chat' | 'copy' = 'whatsapp'
) {
  if (supabase) {
    await supabase.rpc('increment_contact', { ad_id: adisoId });
  }
  const eventType =
    channel === 'chat' ? 'ad.contact_chat' : channel === 'copy' ? 'ad.contact_copy' : 'ad.contact_whatsapp';
  trackEvent(eventType, {
    entityType: 'adiso',
    entityId: adisoId,
    payload: { categoria, channel },
    userId: userId ?? null,
  });
  return registrarEvento(userId, 'contacto', `contacto_${channel}`, { adiso_id: adisoId, categoria, channel });
}

/**
 * Registra una visualización de adiso e incrementa el contador
 */
export async function registrarVisualizacion(userId: string | undefined, adisoId: string, duracionSegundos?: number) {
  if (supabase) {
    await supabase.rpc('increment_view', { ad_id: adisoId });
  }
  if (duracionSegundos !== undefined) {
    trackEvent('ad.view_end', {
      entityType: 'adiso',
      entityId: adisoId,
      payload: { duracion_segundos: duracionSegundos },
      userId: userId ?? null,
    });
  } else {
    trackEvent('ad.view_start', {
      entityType: 'adiso',
      entityId: adisoId,
      userId: userId ?? null,
    });
  }
  return registrarEvento(userId, 'visualizacion', 'adiso_visto', {
    adiso_id: adisoId,
    duracion_segundos: duracionSegundos,
  });
}














