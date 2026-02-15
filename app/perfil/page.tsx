'use client';

import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import NavbarMobile from '@/components/NavbarMobile';
import LeftSidebar from '@/components/LeftSidebar';
import { useNavigation } from '@/contexts/NavigationContext';
import { useAuth } from '@/hooks/useAuth';
import { getMyAdisos, getAdisoById } from '@/lib/storage';
import { Adiso } from '@/types';
import GrillaAdisos from '@/components/GrillaAdisos';
import { FaUserCircle, FaEnvelope, FaCog, FaSignOutAlt, FaHistory } from 'react-icons/fa';

export default function PerfilPage() {
    const { setSidebarExpanded } = useNavigation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { user, signOut } = useAuth();
    const [myAdisos, setMyAdisos] = useState<Adiso[]>([]);
    const [loading, setLoading] = useState(true);

    React.useEffect(() => {
        setSidebarExpanded(false);
    }, [setSidebarExpanded]);

    useEffect(() => {
        // Fetch user's ads
        const fetchMyAdisos = async () => {
            const ids = getMyAdisos();
            if (ids.length === 0) {
                setMyAdisos([]);
                setLoading(false);
                return;
            }

            try {
                const promises = ids.map(id => getAdisoById(id));
                const results = await Promise.all(promises);
                const validAdisos = results.filter((a): a is Adiso => a !== null);
                setMyAdisos(validAdisos);
            } catch (error) {
                console.error("Error fetching my adisos", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMyAdisos();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex flex-col pb-16 md:pb-0">
            <Header
                onToggleLeftSidebar={() => setSidebarOpen(true)}
                seccionActiva={'perfil' as any}
            />

            <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
                {/* Profile Header */}
                <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm p-6 mb-8 border border-gray-100 dark:border-zinc-700">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-4xl shadow-md">
                            <FaUserCircle />
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                {user ? `Hola, ${user.email?.split('@')[0] || 'Usuario'}` : 'Mi Perfil'}
                            </h1>
                            <div className="flex flex-col md:flex-row gap-4 items-center text-gray-500 dark:text-gray-400 text-sm">
                                <span className="flex items-center gap-2">
                                    <FaEnvelope /> {user?.email || 'usuario@ejemplo.com'}
                                </span>
                                <span className="flex items-center gap-2">
                                    <FaHistory /> Miembro desde 2024
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button className="px-4 py-2 bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-600 transition-colors flex items-center gap-2 text-sm font-medium">
                                <FaCog /> Configuración
                            </button>
                            <button
                                onClick={() => signOut()}
                                className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2 text-sm font-medium"
                            >
                                <FaSignOutAlt /> Cerrar Sesión
                            </button>
                        </div>
                    </div>
                </div>

                {/* Dashboard Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white dark:bg-zinc-800 p-4 rounded-xl border border-gray-100 dark:border-zinc-700 text-center">
                        <div className="text-3xl font-bold text-blue-600 mb-1">{myAdisos.length}</div>
                        <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Mis Anuncios</div>
                    </div>
                    <div className="bg-white dark:bg-zinc-800 p-4 rounded-xl border border-gray-100 dark:border-zinc-700 text-center">
                        <div className="text-3xl font-bold text-green-600 mb-1">0</div>
                        <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Ventas</div>
                    </div>
                    <div className="bg-white dark:bg-zinc-800 p-4 rounded-xl border border-gray-100 dark:border-zinc-700 text-center">
                        <div className="text-3xl font-bold text-purple-600 mb-1">0</div>
                        <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Vistas</div>
                    </div>
                    <div className="bg-white dark:bg-zinc-800 p-4 rounded-xl border border-gray-100 dark:border-zinc-700 text-center">
                        <div className="text-3xl font-bold text-yellow-500 mb-1">4.9</div>
                        <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Calificación</div>
                    </div>
                </div>

                {/* My Ads Section */}
                <div className="mb-8">
                    <div className="flex justify-between items-end mb-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Mis Publicaciones</h2>
                        <a href="/publicar" className="text-sm text-blue-600 font-medium hover:underline">
                            + Crear nuevo anuncio
                        </a>
                    </div>

                    {loading ? (
                        <div className="flex justify-center p-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : myAdisos.length > 0 ? (
                        <GrillaAdisos
                            adisos={myAdisos}
                            onAbrirAdiso={(adiso) => window.location.href = `/?adiso=${adiso.id}`}
                        />
                    ) : (
                        <div className="text-center py-16 bg-white dark:bg-zinc-800 rounded-xl border border-dashed border-gray-300 dark:border-zinc-700">
                            <div className="text-4xl mb-4 opacity-50">📢</div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Aún no has publicado nada</h3>
                            <p className="text-gray-500 dark:text-gray-400 mt-2 mb-6 max-w-md mx-auto">
                                Publica tu primer anuncio hoy mismo y llega a miles de personas en Cusco. Es rápido y gratis.
                            </p>
                            <a
                                href="/publicar"
                                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all"
                            >
                                Publicar Anuncio
                            </a>
                        </div>
                    )}
                </div>
            </main>

            <LeftSidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            <div className="block md:hidden">
                <NavbarMobile
                    seccionActiva={'perfil' as any}
                    tieneAdisoAbierto={false}
                    onCambiarSeccion={() => { }}
                />
            </div>
        </div>
    );
}
