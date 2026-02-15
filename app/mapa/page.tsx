'use client';

import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import NavbarMobile from '@/components/NavbarMobile';
import LeftSidebar from '@/components/LeftSidebar';
import { useNavigation } from '@/contexts/NavigationContext';
import { getAdisos } from '@/lib/storage';
import { Adiso } from '@/types';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation'; // Correct import for App Router

const MapaInteractivo = dynamic(() => import('@/components/MapaInteractivo'), {
    loading: () => <div className="h-full w-full flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>,
    ssr: false,
});

export default function MapaPage() {
    const { setSidebarExpanded } = useNavigation();
    const [sidebarOpen, setSidebarOpen] = React.useState(false);
    const [adisos, setAdisos] = useState<Adiso[]>([]);
    const router = useRouter();

    React.useEffect(() => {
        setSidebarExpanded(false);
    }, [setSidebarExpanded]);

    useEffect(() => {
        const fetchAdisos = async () => {
            try {
                const data = await getAdisos();
                setAdisos(data);
            } catch (error) {
                console.error("Error al cargar adisos para mapa", error);
            }
        };
        fetchAdisos();
    }, []);

    return (
        <div className="h-screen bg-gray-50 dark:bg-zinc-900 flex flex-col overflow-hidden">
            <Header
                onToggleLeftSidebar={() => setSidebarOpen(true)}
                seccionActiva={'mapa' as any}
            />

            {/* Map Container - Full Height minus header */}
            <main className="flex-1 relative w-full h-[calc(100vh-72px)]">
                <MapaInteractivo
                    adisos={adisos}
                    onAbrirAdiso={(adiso) => {
                        router.push(`/?adiso=${adiso.id}`);
                    }}
                />
            </main>

            <LeftSidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            <div className="block md:hidden pb-safe"> {/* pb-safe handles safe area if needed */}
                <NavbarMobile
                    seccionActiva={'mapa' as any}
                    tieneAdisoAbierto={false}
                    onCambiarSeccion={() => { }}
                />
            </div>
        </div>
    );
}
