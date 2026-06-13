import { createAdisoInSupabase } from './supabase';
import { Adiso, Categoria, Profile } from '@/types';
import { DraftListingData } from '@/components/ai/DraftListingCard';

/**
 * Publica un anuncio "rápido" generado a partir del buscador unificado
 * (búsqueda / publicación con IA).
 */
export async function publishQuickAd(
    userId: string,
    profile: Profile | null,
    draft: DraftListingData
): Promise<Adiso> {
    const now = new Date();

    const adiso: Adiso = {
        id: `adiso-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        categoria: draft.categoria as Categoria,
        titulo: draft.titulo,
        descripcion: draft.descripcion,
        contacto: profile?.telefono || 'No especificado',
        ubicacion: profile?.ubicacion || 'Cusco',
        fechaPublicacion: now.toISOString().split('T')[0],
        horaPublicacion: now.toTimeString().slice(0, 5),
        tamaño: 'miniatura',
        usuario_id: userId,
        user_id: userId,
        precio: draft.precio,
    };

    return createAdisoInSupabase(adiso);
}
