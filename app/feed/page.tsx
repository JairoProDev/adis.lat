'use client';

import React from 'react';
import Header from '@/components/Header';
import NavbarMobile from '@/components/NavbarMobile';
import LeftSidebar from '@/components/LeftSidebar';
import { useNavigation } from '@/contexts/NavigationContext';

// We can reuse the main feed component logic here or create a specialized one.
// For now, let's restart the main page logic but focused on "Feed" view (perhaps following users?)
// The user request implies "Feed" is distinct from "Search".
// If "Feed" implies a social feed of followed sellers, we need that logic.
// If it's just the main list, we can import GrillaAdisos.

export default function FeedPage() {
    const { setSidebarExpanded } = useNavigation();
    const [sidebarOpen, setSidebarOpen] = React.useState(false);

    React.useEffect(() => {
        setSidebarExpanded(false);
    }, [setSidebarExpanded]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex flex-col pb-16 md:pb-0">
            <Header
                onToggleLeftSidebar={() => setSidebarOpen(true)}
                seccionActiva={'feed'}
            />
            <main className="flex-1 container mx-auto px-4 py-6">
                <h1 className="text-2xl font-bold mb-4 dark:text-white">Tu Feed</h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Aquí verás las últimas publicaciones de los vendedores que sigues.
                    (Funcionalidad en desarrollo)
                </p>
                {/* TODO: Implement Following Feed */}
            </main>
            <LeftSidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />
            <div className="block md:hidden">
                <NavbarMobile
                    seccionActiva={'feed'}
                    tieneAdisoAbierto={false}
                />
            </div>
        </div>
    );
}
