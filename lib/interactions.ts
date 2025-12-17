import { supabase } from './supabase';
import { UserAdInteraction, AdInteractionType } from '@/types';

/**
 * Registra una interacción (not_interested, etc)
 */
export async function registrarInteraccion(
    userId: string,
    adisoId: string,
    tipo: AdInteractionType
): Promise<UserAdInteraction | null> {
    if (!supabase) return null;

    try {
        const { data, error } = await supabase
            .from('user_ad_interactions')
            .insert({
                user_id: userId,
                adiso_id: adisoId,
                interaction_type: tipo
            })
            .select()
            .single();

        if (error) {
            // Ignorar error de duplicados
            if (error.code === '23505') return null;
            console.error('Error al registrar interacción:', error);
            return null;
        }

        return data as UserAdInteraction;
    } catch (err) {
        console.error('Error en registrarInteraccion:', err);
        return null;
    }
}

/**
 * Obtiene las interacciones de un usuario para una lista de adisos (optimización)
 * o para todos si no se pasa lista.
 * Retorna un Set de IDs para búsqueda rápida.
 */
export async function getInteraccionesUsuario(
    userId: string,
    tipo: AdInteractionType
): Promise<Set<string>> {
    if (!supabase) return new Set();

    const { data, error } = await supabase
        .from('user_ad_interactions')
        .select('adiso_id')
        .eq('user_id', userId)
        .eq('interaction_type', tipo);

    if (error) {
        console.error('Error obteniendo interacciones:', error);
        return new Set();
    }

    return new Set(data.map((d: any) => d.adiso_id));
}
