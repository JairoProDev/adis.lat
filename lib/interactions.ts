import { supabase, dbToAdiso } from './supabase';
import { UserAdInteraction, AdInteractionType, Adiso } from '@/types';



/**
 * Obtiene los adisos ocultos (not_interested)
 */
export async function getAdisosOcultos(userId: string): Promise<Adiso[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('user_ad_interactions')
        .select('adiso_id')
        .eq('user_id', userId)
        .eq('interaction_type', 'not_interested');

    if (error || !data || data.length === 0) return [];

    const adisoIds = data.map((d: any) => d.adiso_id);

    // Fetch adisos
    const { data: adisos, error: adisosError } = await supabase
        .from('adisos')
        .select('*')
        .in('id', adisoIds);

    if (adisosError) return [];

    return (adisos || []).map((row: any) => dbToAdiso(row));
}

/**
 * Restaura un adiso oculto (elimina la interacción not_interested)
 */
export async function restaurarAdisoOculto(userId: string, adisoId: string): Promise<void> {
    if (!supabase) return;

    const { error } = await supabase
        .from('user_ad_interactions')
        .delete()
        .eq('user_id', userId)
        .eq('adiso_id', adisoId)
        .eq('interaction_type', 'not_interested');

    if (error) throw error;
}

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
