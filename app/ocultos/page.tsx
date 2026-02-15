'use client';

import React from 'react';
import Header from '@/components/Header';
import NavbarMobile from '@/components/NavbarMobile';
import LeftSidebar from '@/components/LeftSidebar';
import { useNavigation } from '@/contexts/NavigationContext';

export default function OcultosPage() {
    const { setSidebarExpanded } = useNavigation();
    const [sidebarOpen, setSidebarOpen] = React.useState(false);

    React.useEffect(() => {
        setSidebarExpanded(false);
    }, [setSidebarExpanded]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex flex-col pb-16 md:pb-0">
            <Header
                onToggleLeftSidebar={() => setSidebarOpen(true)}
                seccionActiva={'ocultos' as any}
            />
            <main className="flex-1 container mx-auto px-4 py-6">
                <h1 className="text-2xl font-bold mb-4 dark:text-white">Anuncios Ocultos</h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Aquí aparecerán los anuncios que hayas decidido ocultar para no ver más.
                    (Funcionalidad en desarrollo)
                </p>
                {/* TODO: Implement Hidden Ads List */}
            </main>
            <LeftSidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />
            <div className="block md:hidden">
                <NavbarMobile
                    seccionActiva={'ocultos' as any}
                    tieneAdisoAbierto={false}
                />
            </div>
        </div>
    );
}
