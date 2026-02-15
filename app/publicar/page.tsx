'use client';

import React, { useState } from 'react';
import Header from '@/components/Header';
import NavbarMobile from '@/components/NavbarMobile';
import LeftSidebar from '@/components/LeftSidebar';
import { useNavigation } from '@/contexts/NavigationContext';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

const FormularioPublicar = dynamic(() => import('@/components/FormularioPublicar'), {
    loading: () => <div className="p-8 text-center">Cargando formulario...</div>,
    ssr: false,
});

export default function PublicarPage() {
    const router = useRouter();
    const { setSidebarExpanded } = useNavigation();
    const [sidebarOpen, setSidebarOpen] = React.useState(false);

    React.useEffect(() => {
        setSidebarExpanded(false);
    }, [setSidebarExpanded]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex flex-col pb-16 md:pb-0">
            <Header
                onToggleLeftSidebar={() => setSidebarOpen(true)}
                seccionActiva={'publicar'}
            />
            <main className="flex-1 w-full bg-white dark:bg-zinc-900">
                <div className="container mx-auto px-4 py-8 max-w-3xl">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8 text-center">
                        Publicar Nuevo Anuncio
                    </h1>

                    <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-700 p-6 md:p-8">
                        <FormularioPublicar
                            esPaginaCompleta={true}
                            onPublicar={(adiso) => {
                                // Redirect to home and open the new ad
                                router.push(`/?adiso=${adiso.id}`);
                            }}
                        />
                    </div>
                </div>
            </main>
            <LeftSidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />
            <div className="block md:hidden">
                <NavbarMobile
                    seccionActiva={'publicar'}
                    seccionActiva={'publicar'}
                    tieneAdisoAbierto={false}
                    onCambiarSeccion={() => { }}
                />
            </div>
        </div>
    );
}
