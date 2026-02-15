'use client';

import React, { useEffect, useState } from 'react';
import { Adiso } from '@/types';
import GrillaAdisos from '@/components/GrillaAdisos';
import { getHiddenAdisos, getAdisoById } from '@/lib/storage';
import Header from '@/components/Header';
import NavbarMobile from '@/components/NavbarMobile';
import LeftSidebar from '@/components/LeftSidebar';
import { useNavigation } from '@/contexts/NavigationContext';

export default function OcultosPage() {
    const { setSidebarExpanded } = useNavigation();
    const [sidebarOpen, setSidebarOpen] = React.useState(false);
    const [hiddenAdisos, setHiddenAdisos] = useState<Adiso[]>([]);
    const [loading, setLoading] = useState(true);

    React.useEffect(() => {
        setSidebarExpanded(false);
    }, [setSidebarExpanded]);

    useEffect(() => {
        const fetchHidden = async () => {
            const ids = getHiddenAdisos();
            if (ids.length === 0) {
                setHiddenAdisos([]);
                setLoading(false);
                return;
            }

            try {
                const promises = ids.map(id => getAdisoById(id));
                const results = await Promise.all(promises);
                const validAdisos = results.filter((a): a is Adiso => a !== null);
                setHiddenAdisos(validAdisos);
            } catch (error) {
                console.error("Error fetching hidden adisos", error);
            } finally {
                setLoading(false);
            }
        };
        fetchHidden();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex flex-col pb-16 md:pb-0">
            <Header
                onToggleLeftSidebar={() => setSidebarOpen(true)}
                seccionActiva={'ocultos' as any}
            />
            <main className="flex-1 container mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold mb-6 dark:text-white">Anuncios Ocultos</h1>
                <p className="text-gray-500 mb-6">Estos anuncios no aparecerán en tus búsquedas.</p>

                {loading ? (
                    <div className="flex justify-center p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : hiddenAdisos.length > 0 ? (
                    <GrillaAdisos
                        adisos={hiddenAdisos}
                        onAbrirAdiso={(adiso) => window.location.href = `/?adiso=${adiso.id}`}
                    />
                ) : (
                    <div className="text-center py-12 bg-white dark:bg-zinc-800 rounded-xl shadow-sm">
                        <div className="text-4xl mb-4">👁️‍🗨️</div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">No hay anuncios ocultos</h3>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">Los anuncios que ocultes aparecerán aquí.</p>
                    </div>
                )}
            </main>
            <LeftSidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />
            <div className="block md:hidden">
                <NavbarMobile
                    seccionActiva={'ocultos' as any}
                    tieneAdisoAbierto={false}
                    onCambiarSeccion={() => { }}
                />
            </div>
        </div>
    );
}
