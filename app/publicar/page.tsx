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
                <div className="container mx-auto px-4 py-8 max-w-2xl">
                    <FormularioPublicar
                        onCerrar={() => router.push('/')}
                        onPublicar={(adiso) => {
                            // Redirect to home and open the new ad
                            router.push(`/?adiso=${adiso.id}`);
                        }}
                    />
                </div>
            </main>
            <LeftSidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />
            <div className="block md:hidden">
                <NavbarMobile
                    seccionActiva={'publicar'}
                    tieneAdisoAbierto={false}
                />
            </div>
        </div>
    );
}
