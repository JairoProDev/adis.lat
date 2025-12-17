import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { toggleFavorito, esFavorito } from '@/lib/favoritos';
import { registrarInteraccion } from '@/lib/interactions';
import { useToast } from '@/hooks/useToast';
import { useUI } from '@/contexts/UIContext';

const GUEST_FAVORITES_KEY = 'guest_favorites';
const GUEST_HIDDEN_KEY = 'guest_hidden';

export function useAdInteraction(adisoId: string, initialIsFavorite: boolean = false) {
    const { user, loading: authLoading } = useAuth();
    const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
    const [isHidden, setIsHidden] = useState(false);
    const [loading, setLoading] = useState(false);
    const { success, error: toastError } = useToast();
    const { openAuthModal } = useUI();

    // Load initial state
    useEffect(() => {
        async function loadState() {
            if (authLoading) return;

            if (user?.id) {
                // Authenticated: Check DB
                try {
                    const fav = await esFavorito(user.id, adisoId);
                    setIsFavorite(fav);
                } catch (e) {
                    console.error(e);
                }
            } else {
                // Guest: Check LocalStorage
                try {
                    const localFavs = JSON.parse(localStorage.getItem(GUEST_FAVORITES_KEY) || '[]');
                    setIsFavorite(localFavs.includes(adisoId));

                    const localHidden = JSON.parse(localStorage.getItem(GUEST_HIDDEN_KEY) || '[]');
                    setIsHidden(localHidden.includes(adisoId));
                } catch (e) {
                    console.error("Error reading local storage", e);
                }
            }
        }
        loadState();
    }, [user?.id, adisoId, authLoading]);

    const toggleFav = async (e?: React.MouseEvent) => {
        e?.stopPropagation();
        e?.preventDefault(); // Prevent opening the ad

        const newState = !isFavorite;
        setIsFavorite(newState); // Optimistic

        if (user?.id) {
            // Authenticated
            try {
                await toggleFavorito(user.id, adisoId);
                if (newState) {
                    registrarInteraccion(user.id, adisoId, 'favorite');
                }
                success(newState ? 'Añadido a favoritos' : 'Eliminado de favoritos');
            } catch (err) {
                setIsFavorite(!newState); // Revert
                toastError('Error al guardar favorito');
            }
        } else {
            // Guest
            const localFavs = JSON.parse(localStorage.getItem(GUEST_FAVORITES_KEY) || '[]');
            let newFavs;
            if (newState) {
                newFavs = [...localFavs, adisoId];
                // Show nudge to login
                success('Guardado. Inicia sesión para sincronizar.');
                openAuthModal();
            } else {
                newFavs = localFavs.filter((id: string) => id !== adisoId);
                success('Eliminado de favoritos');
            }
            localStorage.setItem(GUEST_FAVORITES_KEY, JSON.stringify(newFavs));
        }
    };

    const markNotInterested = async (e?: React.MouseEvent) => {
        e?.stopPropagation();
        e?.preventDefault();

        setIsHidden(true); // Optimistic UI

        if (user?.id) {
            try {
                await registrarInteraccion(user.id, adisoId, 'not_interested');
                success('Anuncio ocultado.');
            } catch (err) {
                setIsHidden(false);
            }
        } else {
            // Guest
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
        isFavorite,
        isHidden,
        toggleFav,
        markNotInterested,
        loading
    };
}
