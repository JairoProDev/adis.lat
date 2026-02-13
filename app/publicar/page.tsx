'use client';

import React, { Suspense } from 'react';
import Header from '@/components/Header';
import FormularioPublicar from '@/components/FormularioPublicar';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/Toast';
import LeftSidebar from '@/components/LeftSidebar';
import { useState } from 'react';

function PublicarPageContent() {
    const router = useRouter();
    const { success, error, toasts, removeToast } = useToast();
    const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[var(--bg-secondary)]">
            <Header
                onToggleLeftSidebar={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
            />

            <main className="max-w-4xl mx-auto px-4 py-8 md:py-12">
                <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
                    <div className="md:flex">
                        {/* Info Side (Hidden on mobile) */}
                        <div className="hidden md:flex md:w-1/3 bg-slate-900 p-10 text-white flex-col justify-between relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--brand-color)] rounded-full blur-[100px] opacity-20 -translate-y-1/2 translate-x-1/2" />

                            <div className="relative z-10">
                                <h1 className="text-3xl font-black mb-4">¿Tienes algo que anunciar?</h1>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    Únete a miles de personas que publican en Buscadis. Es rápido, seguro y efectivo.
                                </p>
                            </div>

                            <div className="relative z-10 space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                                        <span className="font-bold text-[var(--brand-color)]">1</span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">Elige Categoría</p>
                                        <p className="text-xs text-slate-500">Empleos, Productos, Servicios y más.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                                        <span className="font-bold text-[var(--brand-color)]">2</span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">Sube Fotos</p>
                                        <p className="text-xs text-slate-500">Muestra lo mejor de tu anuncio.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                                        <span className="font-bold text-[var(--brand-color)]">3</span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">¡Listo!</p>
                                        <p className="text-xs text-slate-500">Recibe contactos en WhatsApp.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Form Side */}
                        <div className="flex-1 p-6 md:p-10 bg-white">
                            <FormularioPublicar
                                onPublicar={(adiso) => {
                                    success('¡Anuncio publicado correctamente!');
                                    setTimeout(() => router.push(`/?adiso=${adiso.id}`), 1500);
                                }}
                                onCerrar={() => router.push('/')}
                                onError={error}
                                onSuccess={success}
                            />
                        </div>
                    </div>
                </div>
            </main>

            <LeftSidebar
                isOpen={isLeftSidebarOpen}
                onClose={() => setIsLeftSidebarOpen(false)}
            />

            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </div>
    );
}

export default function PublicarPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-slate-400 font-medium">Cargando...</div>
            </div>
        }>
            <PublicarPageContent />
        </Suspense>
    );
}
