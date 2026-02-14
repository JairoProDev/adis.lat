'use client';

import React, { Suspense } from 'react';
import Header from '@/components/Header';
import FormularioPublicar from '@/components/FormularioPublicar';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/Toast';
import LeftSidebar from '@/components/LeftSidebar';
import { useState } from 'react';
import { IconMegaphone } from '@/components/Icons';

function PublicarPageContent() {
    const router = useRouter();
    const { success, error, toasts, removeToast } = useToast();
    const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[var(--bg-secondary)]">
            <Header
                onToggleLeftSidebar={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
            />

            <main className="max-w-6xl mx-auto px-4 py-8 md:py-16">
                <div className="bg-[var(--bg-primary)] rounded-[2.5rem] shadow-2xl shadow-[var(--brand-blue)]/5 overflow-hidden border border-[var(--border-subtle)]">
                    <div className="md:flex min-h-[600px]">
                        {/* Info Side (Hidden on mobile) */}
                        <div className="hidden md:flex md:w-2/5 bg-gradient-to-br from-[var(--brand-blue)] to-[#3d8da3] p-12 text-white flex-col justify-between relative overflow-hidden">
                            {/* Decorative Elements */}
                            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[var(--brand-yellow)]/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />

                            <div className="relative z-10">
                                <div className="w-12 h-12 bg-white/20 rounded-2xl backdrop-blur-md flex items-center justify-center mb-8">
                                    <IconMegaphone size={24} color="white" />
                                </div>
                                <h1 className="text-4xl font-black mb-6 leading-tight">¿Tienes algo que anunciar?</h1>
                                <p className="text-white/80 text-lg leading-relaxed max-w-xs">
                                    Únete a miles de personas que publican en Buscadis. Es rápido, seguro y efectivo.
                                </p>
                            </div>

                            <div className="relative z-10 space-y-8">
                                <div className="flex items-start gap-5 group">
                                    <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center flex-shrink-0 transition-all group-hover:scale-110 group-hover:bg-white/25">
                                        <span className="font-bold text-white">1</span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-lg mb-1">Elige Categoría</p>
                                        <p className="text-sm text-white/60">Empleos, Productos, Servicios y más.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-5 group">
                                    <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center flex-shrink-0 transition-all group-hover:scale-110 group-hover:bg-white/25">
                                        <span className="font-bold text-white">2</span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-lg mb-1">Sube Fotos</p>
                                        <p className="text-sm text-white/60">Muestra lo mejor de tu anuncio.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-5 group">
                                    <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center flex-shrink-0 transition-all group-hover:scale-110 group-hover:bg-white/25">
                                        <span className="font-bold text-white">3</span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-lg mb-1 font-display">¡Listo!</p>
                                        <p className="text-sm text-white/60">Recibe contactos en WhatsApp.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="relative z-10 pt-10 border-t border-white/10">
                                <p className="text-xs text-white/40 uppercase tracking-widest font-bold">Adis.lat Platform</p>
                            </div>
                        </div>

                        {/* Form Side */}
                        <div className="flex-1 p-8 md:p-14 bg-[var(--bg-primary)]">
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
