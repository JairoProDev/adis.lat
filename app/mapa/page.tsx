'use client';

import React from 'react';
import Header from '@/components/Header';
import NavbarMobile from '@/components/NavbarMobile';
import LeftSidebar from '@/components/LeftSidebar';
import { useNavigation } from '@/contexts/NavigationContext';
import dynamic from 'next/dynamic';

const MapaInteractivo = dynamic(() => import('@/components/MapaInteractivo'), {
    loading: () => <div className="h-full flex items-center justify-center">Cargando mapa...</div>,
    ssr: false,
});

export default function MapaPage() {
    const { setSidebarExpanded } = useNavigation();
    const [sidebarOpen, setSidebarOpen] = React.useState(false);

    React.useEffect(() => {
        setSidebarExpanded(false);
    }, [setSidebarExpanded]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex flex-col pb-16 md:pb-0">
            <Header
                onToggleLeftSidebar={() => setSidebarOpen(true)}
                seccionActiva={'mapa'}
            />
            {/* Map Container */}
            <main className="flex-1 relative h-[calc(100vh-72px)] w-full">
                <MapaInteractivo
                    adisos={[]} // TODO: Fetch geolocated ads
                    ubicacionUsuario={null}
                    onVerAdiso={() => { }}
                />
            </main>
            <LeftSidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />
            <div className="block md:hidden">
                <NavbarMobile
                    seccionActiva={'mapa'}
                    tieneAdisoAbierto={false}
                />
            </div>
        </div>
    );
}
