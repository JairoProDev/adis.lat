'use client';

import React from 'react';
import Header from '@/components/Header';
import NavbarMobile from '@/components/NavbarMobile';
import LeftSidebar from '@/components/LeftSidebar';
import { useNavigation } from '@/contexts/NavigationContext';

export default function FavoritosPage() {
    const { setSidebarExpanded } = useNavigation();
    const [sidebarOpen, setSidebarOpen] = React.useState(false);

    React.useEffect(() => {
        setSidebarExpanded(false);
    }, [setSidebarExpanded]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex flex-col pb-16 md:pb-0">
            <Header
                onToggleLeftSidebar={() => setSidebarOpen(true)}
                seccionActiva={'favoritos' as any}
            />
            <main className="flex-1 container mx-auto px-4 py-6">
                <h1 className="text-2xl font-bold mb-4 dark:text-white">Mis Favoritos</h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Aquí aparecerán los anuncios que guardes.
                    (Funcionalidad en desarrollo)
                </p>
                {/* TODO: Implement Favorites List */}
            </main>
            <LeftSidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />
            <div className="block md:hidden">
                <NavbarMobile
                    seccionActiva={'favoritos' as any}
                    tieneAdisoAbierto={false}
                />
            </div>
        </div>
    );
}
