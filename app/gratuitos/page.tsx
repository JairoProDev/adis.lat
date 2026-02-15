'use client';

import React from 'react';
import Header from '@/components/Header';
import NavbarMobile from '@/components/NavbarMobile';
import LeftSidebar from '@/components/LeftSidebar';
import { useNavigation } from '@/contexts/NavigationContext';
import AdisosGratuitos from '@/components/AdisosGratuitos';
import { useAuth } from '@/hooks/useAuth';

export default function GratuitosPage() {
    const { setSidebarExpanded } = useNavigation();
    const [sidebarOpen, setSidebarOpen] = React.useState(false);
    const { user } = useAuth();

    React.useEffect(() => {
        setSidebarExpanded(false);
    }, [setSidebarExpanded]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex flex-col pb-16 md:pb-0">
            <Header
                onToggleLeftSidebar={() => setSidebarOpen(true)}
                seccionActiva={'gratuitos' as any}
            />
            <main className="flex-1 container mx-auto px-4 py-6">
                {/* Reusing AdisosGratuitos component or logic */}
                <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-sm p-6">
                    <h1 className="text-2xl font-bold mb-6 dark:text-white">Anuncios Gratuitos</h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Aprovecha estas ofertas de productos y servicios gratuitos cerca de ti.
                    </p>
                    <AdisosGratuitos todosLosAdisos={[]} /> {/* TODO: pass real data if needed, or component handles fetching */}
                </div>
            </main>
            <LeftSidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />
            <div className="block md:hidden">
                <NavbarMobile
                    seccionActiva={'gratuitos' as any}
                    tieneAdisoAbierto={false}
                />
            </div>
        </div>
    );
}
