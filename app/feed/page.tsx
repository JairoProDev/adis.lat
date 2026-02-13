'use client';

import React from 'react';
import Header from '@/components/Header';
import { FaGlobeAmericas, FaUsers, FaStar, FaStore } from 'react-icons/fa';
import NavbarMobile from '@/components/NavbarMobile';

export default function FeedPage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex flex-col pb-16 md:pb-0">
            <Header
                onToggleLeftSidebar={() => { }}
                seccionActiva={'feed' as any}
            />
            <main className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-700">
                <div className="relative mb-8 group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-violet-600 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative w-28 h-28 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center border-4 border-white dark:border-zinc-700 shadow-xl">
                        <FaGlobeAmericas size={56} className="text-transparent bg-clip-text bg-gradient-to-br from-blue-500 to-violet-500" />
                    </div>
                </div>

                <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-blue-800 to-gray-900 dark:from-white dark:via-blue-300 dark:to-white mb-4 tracking-tight">
                    Comunidad Adis
                </h1>

                <p className="text-lg text-gray-600 dark:text-gray-300 max-w-xl mb-8 leading-relaxed">
                    Estamos construyendo la primera red social enfocada en conectar compradores y vendedores locales. Historias, ofertas flash y reseñas verificadas.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full text-left">
                    <div className="p-6 bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-700 hover:shadow-md transition-shadow">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400">
                            <FaUsers size={20} />
                        </div>
                        <h3 className="font-bold text-gray-900 dark:text-white mb-2">Conecta</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Sigue a tus tiendas favoritas y entérate primero de sus novedades.</p>
                    </div>

                    <div className="p-6 bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-700 hover:shadow-md transition-shadow">
                        <div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/30 rounded-lg flex items-center justify-center mb-4 text-violet-600 dark:text-violet-400">
                            <FaStar size={20} />
                        </div>
                        <h3 className="font-bold text-gray-900 dark:text-white mb-2">Descubre</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Encuentra joyas ocultas y ofertas exclusivas cerca de ti.</p>
                    </div>

                    <div className="p-6 bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-700 hover:shadow-md transition-shadow">
                        <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center mb-4 text-amber-600 dark:text-amber-400">
                            <FaStore size={20} />
                        </div>
                        <h3 className="font-bold text-gray-900 dark:text-white mb-2">Vende</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Crea tu identidad de marca y fideliza a tus clientes.</p>
                    </div>
                </div>

                <div className="mt-12 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-300 text-sm font-medium">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                    </span>
                    En desarrollo activo
                </div>
            </main>

            <div className="block md:hidden">
                <NavbarMobile
                    seccionActiva={'feed' as any}
                    tieneAdisoAbierto={false}
                    onCambiarSeccion={(seccion: any) => {
                        // Handle sections that require redirection to home
                        if (seccion === 'adiso') {
                            window.location.href = '/';
                        } else {
                            window.location.href = `/?seccion=${seccion}`;
                        }
                    }}
                />
            </div>
        </div>
    );
}
