'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

interface FavoritosContextType {
    favoritosIds: Set<string>;
    isLoaded: boolean;
    isFavorite: (adisoId: string) => boolean;
    addFavorite: (adisoId: string) => Promise<void>;
    removeFavorite: (adisoId: string) => Promise<void>;
    toggleFavorite: (adisoId: string) => Promise<boolean>;
    loadFavorites: () => Promise<void>;
}

const FavoritosContext = createContext<FavoritosContextType | undefined>(undefined);

const GUEST_FAVORITES_KEY = 'guest_favorites';

export function FavoritosProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [favoritosIds, setFavoritosIds] = useState<Set<string>>(new Set());
    const [isLoaded, setIsLoaded] = useState(false);

    // Cargar favoritos de localStorage para invitados
    useEffect(() => {
        if (!user) {
            try {
                const localFavs = JSON.parse(localStorage.getItem(GUEST_FAVORITES_KEY) || '[]');
                setFavoritosIds(new Set(localFavs));
                setIsLoaded(true);
            } catch (e) {
                console.error('Error loading guest favorites:', e);
                setFavoritosIds(new Set());
                setIsLoaded(true);
            }
        } else {
            // Reset cuando cambia el usuario
            setIsLoaded(false);
            setFavoritosIds(new Set());
        }
    }, [user?.id]);

    // Función para cargar favoritos desde la BD (solo cuando se necesite)
    const loadFavorites = useCallback(async () => {
        if (!user?.id || isLoaded) return;

        try {
            if (!supabase) throw new Error('Supabase no está configurado');
            const { data, error } = await supabase
                .from('favoritos')
                .select('adiso_id')
                .eq('user_id', user.id);

            if (error) {
                // Silenciar error 406 (permisos/RLS)
                if (error.message?.includes('406') || (error as any).status === 406) {
                    console.warn('RLS: No se pudieron cargar favoritos');
                    setFavoritosIds(new Set());
                    setIsLoaded(true);
                    return;
                }
                throw error;
            }

            const ids = new Set((data || []).map((f: any) => f.adiso_id));
            setFavoritosIds(ids);
            setIsLoaded(true);
        } catch (error) {
            console.error('Error loading favorites:', error);
            setFavoritosIds(new Set());
            setIsLoaded(true);
        }
    }, [user?.id, isLoaded]);

    const isFavorite = useCallback((adisoId: string) => {
        return favoritosIds.has(adisoId);
    }, [favoritosIds]);

    const addFavorite = useCallback(async (adisoId: string) => {
        // Optimistic update
        setFavoritosIds(prev => new Set([...prev, adisoId]));

        if (user?.id) {
            try {
                // Cargar favoritos si aún no están cargados
                if (!isLoaded) {
                    await loadFavorites();
                }

                if (!supabase) throw new Error('Supabase no está configurado');
                const { error } = await supabase
                    .from('favoritos')
                    .insert({ user_id: user.id, adiso_id: adisoId });

                if (error && error.code !== '23505') { // 23505 = duplicate key (ya existe)
                    throw error;
                }
            } catch (error) {
                // Revert on error
                setFavoritosIds(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(adisoId);
                    return newSet;
                });
                throw error;
            }
        } else {
            // Guest: save to localStorage
            const localFavs = Array.from(favoritosIds);
            localStorage.setItem(GUEST_FAVORITES_KEY, JSON.stringify(localFavs));
        }
    }, [user?.id, favoritosIds, isLoaded, loadFavorites]);

    const removeFavorite = useCallback(async (adisoId: string) => {
        // Optimistic update
        setFavoritosIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(adisoId);
            return newSet;
        });

        if (user?.id) {
            try {
                if (!supabase) throw new Error('Supabase no está configurado');
                const { error } = await supabase
                    .from('favoritos')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('adiso_id', adisoId);

                if (error) throw error;
            } catch (error) {
                // Revert on error
                setFavoritosIds(prev => new Set([...prev, adisoId]));
                throw error;
            }
        } else {
            // Guest: update localStorage
            const localFavs = Array.from(favoritosIds);
            localStorage.setItem(GUEST_FAVORITES_KEY, JSON.stringify(localFavs));
        }
    }, [user?.id, favoritosIds]);

    const toggleFavorite = useCallback(async (adisoId: string): Promise<boolean> => {
        const wasFavorite = isFavorite(adisoId);

        if (wasFavorite) {
            await removeFavorite(adisoId);
            return false;
        } else {
            await addFavorite(adisoId);
            return true;
        }
    }, [isFavorite, addFavorite, removeFavorite]);

    return (
        <FavoritosContext.Provider
            value={{
                favoritosIds,
                isLoaded,
                isFavorite,
                addFavorite,
                removeFavorite,
                toggleFavorite,
                loadFavorites
            }}
        >
            {children}
        </FavoritosContext.Provider>
    );
}

export function useFavoritos() {
    const context = useContext(FavoritosContext);
    if (!context) {
        throw new Error('useFavoritos must be used within FavoritosProvider');
    }
    return context;
}
