import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFavoritos } from '@/contexts/FavoritosContext';
import {
    registrarInteraccion,
    recordInterestSignal,
    setInteractionReason,
    restaurarAdisoOculto,
    getInteraccionesUsuario,
    DismissReason,
} from '@/lib/interactions';
import { trackEvent } from '@/lib/events';
import { registrarFavorito } from '@/lib/analytics';
import { useToast } from '@/hooks/useToast';
import { useUI } from '@/contexts/UIContext';
import { Adiso } from '@/types';

const GUEST_HIDDEN_KEY = 'guest_hidden';

export function useAdInteraction(adiso: Adiso) {
    const adisoId = adiso.id;
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
            return;
        }
        getInteraccionesUsuario(user.id, 'not_interested').then((ids) => {
            setIsHidden(ids.has(adisoId));
        });
    }, [user?.id, adisoId]);

    const toggleFav = async (e?: React.MouseEvent) => {
        e?.stopPropagation();
        e?.preventDefault();

        try {
            const newState = await toggleFavorite(adisoId);

            if (user?.id && newState) {
                registrarInteraccion(user.id, adisoId, 'favorite');
                recordInterestSignal(user.id, adiso, 1);
                registrarFavorito(user.id, adisoId, adiso.categoria);
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
                recordInterestSignal(user.id, adiso, -1);
                trackEvent('ad.dismiss', {
                    entityType: 'adiso',
                    entityId: adisoId,
                    payload: { categoria: adiso.categoria },
                    userId: user.id,
                });
            } catch (err) {
                setIsHidden(false);
            }
        } else {
            try {
                const localHidden = JSON.parse(localStorage.getItem(GUEST_HIDDEN_KEY) || '[]');
                if (!localHidden.includes(adisoId)) {
                    localHidden.push(adisoId);
                    localStorage.setItem(GUEST_HIDDEN_KEY, JSON.stringify(localHidden));
                }
            } catch (e) {
                console.error("Error writing local storage", e);
            }
        }
    };

    const giveFeedback = async (reason: DismissReason) => {
        if (user?.id) {
            try {
                await setInteractionReason(user.id, adisoId, reason);
                await recordInterestSignal(user.id, adiso, -1, reason);
                trackEvent('ad.dismiss_reason', {
                    entityType: 'adiso',
                    entityId: adisoId,
                    payload: { reason, categoria: adiso.categoria },
                    userId: user.id,
                });
            } catch (err) {
                console.error('Error al guardar motivo de descarte:', err);
            }
        }
        success('Gracias, ajustaremos tus recomendaciones.');
    };

    const undoHide = async () => {
        setIsHidden(false);

        if (user?.id) {
            try {
                await restaurarAdisoOculto(user.id, adisoId);
            } catch (err) {
                console.error('Error al restaurar adiso:', err);
            }
        } else {
            try {
                const localHidden = JSON.parse(localStorage.getItem(GUEST_HIDDEN_KEY) || '[]');
                const updated = localHidden.filter((id: string) => id !== adisoId);
                localStorage.setItem(GUEST_HIDDEN_KEY, JSON.stringify(updated));
            } catch (e) {
                console.error("Error writing local storage", e);
            }
        }
    };

    return {
        isFavorite: checkIsFavorite(adisoId),
        isHidden,
        toggleFav,
        markNotInterested,
        giveFeedback,
        undoHide,
        loading
    };
}
