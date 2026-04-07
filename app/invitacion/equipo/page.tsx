'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import AuthModal from '@/components/AuthModal';

function AcceptInvitationContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const { user, loading } = useAuth();
    const [status, setStatus] = useState<'idle' | 'working' | 'ok' | 'err'>('idle');
    const [message, setMessage] = useState('');
    const [showAuth, setShowAuth] = useState(false);

    useEffect(() => {
        if (user) setShowAuth(false);
    }, [user]);

    useEffect(() => {
        if (loading) return;
        if (!token) {
            setStatus('err');
            setMessage('Enlace inválido o incompleto.');
            return;
        }
        if (!user) {
            setShowAuth(true);
            return;
        }

        let cancelled = false;
        (async () => {
            setStatus('working');
            if (!supabase) {
                setStatus('err');
                setMessage('Servicio no disponible.');
                return;
            }
            const { data, error } = await supabase.rpc('accept_business_invitation', {
                p_token: token,
            });
            if (cancelled) return;
            if (error) {
                setStatus('err');
                setMessage(error.message || 'No se pudo aceptar la invitación.');
                return;
            }
            const result = data as { ok?: boolean; error?: string; business_profile_id?: string } | null;
            if (result?.ok && result.business_profile_id) {
                setStatus('ok');
                setMessage('¡Listo! Ya formas parte del equipo.');
                router.replace(`/mi-negocio/equipo?business=${result.business_profile_id}`);
                return;
            }
            const err = result?.error || 'unknown';
            setStatus('err');
            if (err === 'email_mismatch') {
                setMessage(
                    'Debes iniciar sesión con el mismo correo al que se envió la invitación.'
                );
            } else if (err === 'expired') {
                setMessage('Esta invitación expiró. Pide una nueva al administrador.');
            } else if (err === 'invalid_or_used') {
                setMessage('Esta invitación no es válida o ya fue usada.');
            } else {
                setMessage('No se pudo completar la invitación.');
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [loading, user, token, router]);

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center p-6"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
        >
            <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-lg p-8 text-center">
                <h1 className="text-xl font-bold text-slate-900 mb-2">Invitación al equipo</h1>
                {status === 'working' && (
                    <p className="text-slate-600 text-sm">Procesando…</p>
                )}
                {status === 'ok' && <p className="text-emerald-600 text-sm">{message}</p>}
                {status === 'err' && <p className="text-red-600 text-sm">{message}</p>}
                <div className="mt-6">
                    <Link href="/" className="text-sm text-blue-600 hover:underline">
                        Volver al inicio
                    </Link>
                </div>
            </div>
            <AuthModal
                abierto={showAuth && !user}
                onCerrar={() => router.push('/')}
                modoInicial="login"
            />
        </div>
    );
}

export default function AcceptInvitationPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center">
                    <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
            }
        >
            <AcceptInvitationContent />
        </Suspense>
    );
}
