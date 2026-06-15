'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Header from '@/components/Header';
import NavbarMobile from '@/components/NavbarMobile';
import LeftSidebar from '@/components/LeftSidebar';
import { useNavigation } from '@/contexts/NavigationContext';
import dynamic from 'next/dynamic';
import { ToastContainer } from '@/components/Toast';
import { useToast } from '@/hooks/useToast';
import FeedbackButton from '@/components/FeedbackButton';
import { useSearchParams } from 'next/navigation';

const PublishChatWizard = dynamic(() => import('@/components/publish/PublishChatWizard'), {
  loading: () => <div className="p-6 text-center text-sm text-[var(--text-secondary)]">Cargando asistente…</div>,
  ssr: false,
});

function PublicarHubContent() {
  const searchParams = useSearchParams();
  const { setSidebarExpanded } = useNavigation();
  const { toasts, removeToast, success, error } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [initialText, setInitialText] = useState('');
  const [initialImageUrl, setInitialImageUrl] = useState<string | null>(null);
  const [seedKey, setSeedKey] = useState(0);

  useEffect(() => {
    setSidebarExpanded(false);
  }, [setSidebarExpanded]);

  useEffect(() => {
    const titulo = searchParams.get('titulo');
    const descripcion = searchParams.get('descripcion');
    const text = searchParams.get('text') || searchParams.get('descripcion');
    const imagen = searchParams.get('imagen');
    if (titulo || descripcion || text) {
      const combined = [titulo, descripcion || text].filter(Boolean).join('. ');
      setInitialText(combined);
      if (imagen) setInitialImageUrl(imagen);
      setSeedKey((k) => k + 1);
    }
  }, [searchParams]);

  const notify = (msg: string, type?: 'info' | 'error' | 'success') => {
    if (type === 'error') error(msg);
    else if (type === 'success') success(msg);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)] flex flex-col pb-16 md:pb-0">
      <Header onToggleLeftSidebar={() => setSidebarOpen(true)} seccionActiva="publicar" />
      <main className="flex-1 w-full flex flex-col min-h-0">
        <div className="container mx-auto px-4 py-4 md:py-6 max-w-2xl flex-1 flex flex-col min-h-0 w-full">
          <h1 className="text-xl md:text-2xl font-bold text-center mb-1 text-[var(--text-primary)] shrink-0">
            Publica tu aviso
          </h1>
          <p className="text-center text-sm text-[var(--text-secondary)] mb-4 shrink-0">
            Conversa con ADIS abajo — te guía paso a paso.
          </p>

          <div className="flex-1 flex flex-col min-h-[min(680px,calc(100vh-180px))]">
            <PublishChatWizard
              key={seedKey}
              initialText={initialText}
              initialImageUrl={initialImageUrl}
              onNotify={notify}
              onPublished={() => {
                setInitialText('');
                setInitialImageUrl(null);
              }}
            />
          </div>
        </div>
      </main>
      <LeftSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="block md:hidden">
        <NavbarMobile seccionActiva="publicar" tieneAdisoAbierto={false} onCambiarSeccion={() => {}} />
      </div>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <FeedbackButton />
    </div>
  );
}

export default function PublicarPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Cargando…</div>}>
      <PublicarHubContent />
    </Suspense>
  );
}
