import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFavoritos } from '@/contexts/FavoritosContext';
import { registrarInteraccion } from '@/lib/interactions';
import { useToast } from '@/hooks/useToast';
import { useUI } from '@/contexts/UIContext';

const GUEST_HIDDEN_KEY = 'guest_hidden';

export function useAdInteraction(adisoId: string) {
    const { user } = useAuth();
    const { isFavorite: checkIsFavorite, toggleFavorite } = useFavoritos();
    const [isHidden, setIsHidden] = useState(false);
    const [loading, setLoading] = useState(false);
    const { success, error: toastError } = useToast();
    const { openAuthModal } = useUI();

    // Solo cargar estado de "ocultos" (no favoritos, que ahora lo maneja el contexto)
    useEffect(() => {
        if (!user) {
            try {
                const localHidden = JSON.parse(localStorage.getItem(GUEST_HIDDEN_KEY) || '[]');
                setIsHidden(localHidden.includes(adisoId));
            } catch (e) {
                console.error("Error reading local storage", e);
            }
        }
    }, [user?.id, adisoId]);

    const toggleFav = async (e?: React.MouseEvent) => {
        e?.stopPropagation();
        e?.preventDefault();

        try {
            const newState = await toggleFavorite(adisoId);

            if (user?.id && newState) {
                registrarInteraccion(user.id, adisoId, 'favorite');
            }

            success(newState ? 'Añadido a favoritos' : 'Eliminado de favoritos');

            // Para invitados, mostrar modal de login
            if (!user) {
                openAuthModal();
            }
        } catch (err) {
            toastError('Error al guardar favorito');
        }
    };

    const markNotInterested = async (e?: React.MouseEvent) => {
        e?.stopPropagation();
        e?.preventDefault();

        setIsHidden(true);

        if (user?.id) {
            try {
                await registrarInteraccion(user.id, adisoId, 'not_interested');
                success('Anuncio ocultado.');
            } catch (err) {
                setIsHidden(false);
            }
        } else {
            const localHidden = JSON.parse(localStorage.getItem(GUEST_HIDDEN_KEY) || '[]');
            if (!localHidden.includes(adisoId)) {
                localHidden.push(adisoId);
                localStorage.setItem(GUEST_HIDDEN_KEY, JSON.stringify(localHidden));
            }
            success('Anuncio ocultado.');
            openAuthModal();
        }
    };

    return {
        isFavorite: checkIsFavorite(adisoId),
        isHidden,
        toggleFav,
        markNotInterested,
        loading
    };
}
