'use client';

import React from 'react';
import Header from '@/components/Header';
import NavbarMobile from '@/components/NavbarMobile';
import LeftSidebar from '@/components/LeftSidebar';
import FeedView from '@/components/FeedView';
import { useNavigation } from '@/contexts/NavigationContext';

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
                seccionActiva={'feed' as any}
            />

            <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Left Column - Navigation (Already in Sidebar, maybe simplify) */}
                <div className="hidden md:block col-span-1">
                    <div className="sticky top-24 space-y-2">
                        <div className="bg-white dark:bg-zinc-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-zinc-700">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-2">Comunidad</h3>
                            <nav className="space-y-1">
                                <a href="#" className="block px-3 py-2 rounded-lg bg-blue-50 text-blue-700 font-medium text-sm">Noticias</a>
                                <a href="#" className="block px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-600 font-medium text-sm">Eventos</a>
                                <a href="#" className="block px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-600 font-medium text-sm">Grupos</a>
                            </nav>
                        </div>
                    </div>
                </div>

                {/* Center Column - Feed */}
                <div className="col-span-1 md:col-span-2">
                    <h1 className="text-2xl font-bold mb-6 dark:text-white px-2">Noticias y Anuncios</h1>
                    <FeedView />
                </div>

                {/* Right Column - Promoted/Trending */}
                <div className="hidden md:block col-span-1">
                    <div className="sticky top-24 space-y-4">
                        <div className="bg-white dark:bg-zinc-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-zinc-700">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-3 text-sm">Tendencias en Cusco</h3>
                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 bg-gray-100 rounded-lg shrink-0"></div>
                                    <div>
                                        <p className="font-medium text-sm text-gray-900">Festival del Sol</p>
                                        <p className="text-xs text-gray-500">2.4k interesados</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 bg-gray-100 rounded-lg shrink-0"></div>
                                    <div>
                                        <p className="font-medium text-sm text-gray-900">Nuevos empleos</p>
                                        <p className="text-xs text-gray-500">+150 vacantes hoy</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <LeftSidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />
            <div className="block md:hidden">
                <NavbarMobile
                    seccionActiva={'feed' as any}
                    tieneAdisoAbierto={false}
                    onCambiarSeccion={() => { }}
                />
            </div>
        </div>
    );
}
