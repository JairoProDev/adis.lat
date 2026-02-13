import React from 'react';
import Header from '@/components/Header';
import { FaGlobeAmericas } from 'react-icons/fa';
import NavbarMobile from '@/components/NavbarMobile';

export default function FeedPage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex flex-col pb-16 md:pb-0">
            <Header
                onToggleLeftSidebar={() => { }}
                seccionActiva={'feed' as any}
            />
            <main className="flex-1 flex flex-col items-center justify-center p-4 text-center">
                <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-6">
                    <FaGlobeAmericas size={48} className="text-blue-500" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Feed Social
                </h1>
                <p className="text-gray-500 dark:text-gray-400 max-w-md">
                    Próximamente podrás ver las actualizaciones y noticias de tu comunidad y negocios favoritos aquí.
                </p>
            </main>
            <div className="block md:hidden">
                <NavbarMobile
                    seccionActiva={'feed' as any}
                    tieneAdisoAbierto={false}
                    onCambiarSeccion={(seccion) => {
                        // Handle sections that require redirection to home
                        window.location.href = `/?seccion=${seccion}`;
                    }}
                />
            </div>
        </div>
    );
}
