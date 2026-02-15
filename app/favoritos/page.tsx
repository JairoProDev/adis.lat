'use client';

import React, { useEffect, useState } from 'react';
import { Adiso, Categoria, UbicacionDetallada } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { AdisoCard } from '@/components/AdisoCard'; // Might need to check if AdisoCard is default or named export
import GrillaAdisos from '@/components/GrillaAdisos';
import { getFavoriteAdisos, getAdisoById } from '@/lib/storage';
import Header from '@/components/Header';
import NavbarMobile from '@/components/NavbarMobile';
import LeftSidebar from '@/components/LeftSidebar';
import { useNavigation } from '@/contexts/NavigationContext';

export default function FavoritosPage() {
    const { setSidebarExpanded } = useNavigation();
    const [sidebarOpen, setSidebarOpen] = React.useState(false);
    const [favoriteAdisos, setFavoriteAdisos] = useState<Adiso[]>([]);
    const [loading, setLoading] = useState(true);

    React.useEffect(() => {
        setSidebarExpanded(false);
    }, [setSidebarExpanded]);

    useEffect(() => {
        const fetchFavorites = async () => {
            const ids = getFavoriteAdisos();
            if (ids.length === 0) {
                setFavoriteAdisos([]);
                setLoading(false);
                return;
            }

            try {
                const promises = ids.map(id => getAdisoById(id));
                const results = await Promise.all(promises);
                const validAdisos = results.filter((a): a is Adiso => a !== null);
                setFavoriteAdisos(validAdisos);
            } catch (error) {
                console.error("Error fetching favorites", error);
            } finally {
                setLoading(false);
            }
        };
        fetchFavorites();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex flex-col pb-16 md:pb-0">
            <Header
                onToggleLeftSidebar={() => setSidebarOpen(true)}
                seccionActiva={'favoritos' as any}
            />
            <main className="flex-1 container mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold mb-6 dark:text-white">Mis Favoritos</h1>

                {loading ? (
                    <div className="flex justify-center p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : favoriteAdisos.length > 0 ? (
                    <GrillaAdisos
                        adisos={favoriteAdisos}
                        onAbrirAdiso={(adiso) => window.location.href = `/?adiso=${adiso.id}`}
                    />
                ) : (
                    <div className="text-center py-12 bg-white dark:bg-zinc-800 rounded-xl shadow-sm">
                        <div className="text-4xl mb-4">❤️</div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">No tienes favoritos aún</h3>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">Guarda los anuncios que te interesen para verlos aquí.</p>
                    </div>
                )}
            </main>
            <LeftSidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />
            <div className="block md:hidden">
                <NavbarMobile
                    seccionActiva={'favoritos' as any}
                    tieneAdisoAbierto={false}
                    onCambiarSeccion={() => { }}
                />
            </div>
        </div>
    );
}
