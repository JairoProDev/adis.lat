'use client';

import { useState, useEffect } from 'react';

import { getBusinessProfileBySlug } from '@/lib/business';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Adiso } from '@/types';
import BusinessPublicView from '@/components/business/BusinessPublicView';

export default function PublicBusinessPage({ params }: { params: { slug: string } }) {
    const router = useRouter();
    const [profile, setProfile] = useState<any>(null);
    const [adisos, setAdisos] = useState<Adiso[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                // Fetch Profile
                const data = await getBusinessProfileBySlug(params.slug);
                if (data) {
                    setProfile(data);

                    // Fetch Ads (if supabase client exists)
                    if (supabase) {
                        // Note: This relies on your DB policies allowing public read of 'adisos' by 'user_id'
                        const { data: ads } = await supabase
                            .from('adisos')
                            .select('*')
                            .eq('user_id', data.user_id)
                            .eq('esta_activo', true)
                            .order('fecha_publicacion', { ascending: false });

                        if (ads) setAdisos(ads as Adiso[]);
                    }
                }
            } catch (e) {
                console.error("Error loading business info:", e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [params.slug]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-secondary)]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-[var(--brand-blue)] border-t-transparent rounded-full animate-spin" />
                    <div className="text-[var(--text-secondary)] font-medium text-sm">Cargando tienda...</div>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-secondary)] p-4 text-center">
                <div className="text-6xl mb-4 opacity-50">🏪</div>
                <h1 className="text-2xl font-bold mb-2 text-[var(--text-primary)]">Negocio No Encontrado</h1>
                <p className="text-[var(--text-secondary)] max-w-md">
                    Es posible que la dirección sea incorrecta o que la tienda ya no esté disponible.
                </p>
            </div>
        );
    }

    if (!profile.is_published) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-secondary)] p-4 text-center">
                <div className="text-6xl mb-4">🙈</div>
                <h1 className="text-2xl font-bold mb-2 text-[var(--text-primary)]">Tienda en Construcción</h1>
                <p className="text-[var(--text-secondary)]">El propietario está configurando los detalles finales.</p>
            </div>
        );
    }

    // Render the Premium View
    return (
        <BusinessPublicView
            profile={profile}
            adisos={adisos}
            onEditPart={(part) => {
                router.push(`/mi-negocio?edit=${part}`);
            }}
        />
    );
}
