'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getBusinessProfileBySlug } from '@/lib/business';
import { BusinessProfile } from '@/types/business';
import { Adiso } from '@/types';
import BusinessPublicView from '@/components/business/BusinessPublicView';
import { useAuth } from '@/hooks/useAuth';

export default function PublicBusinessPage({ params }: { params: { slug: string } }) {
    const router = useRouter();
    const slug = params.slug;
    const { user } = useAuth();

    const [business, setBusiness] = useState<BusinessProfile | null>(null);
    const [adisos, setAdisos] = useState<Adiso[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (slug) {
            loadBusinessData();
        }
    }, [slug]);

    const loadBusinessData = async () => {
        try {
            // Load business profile
            const profileData = await getBusinessProfileBySlug(slug);

            if (!profileData) {
                // Try to find if it's an ID instead of slug
                // Or just redirect to 404
                console.log('Profile not found for slug:', slug);
                // router.push('/404'); // Commented out to avoid instant redirect during dev
                setLoading(false);
                return;
            }

            setBusiness(profileData);

            // Load products from catalog
            const { data: productsData } = await supabase!
                .from('catalog_products')
                .select('*')
                .eq('business_profile_id', profileData.id)
                .eq('status', 'published')
                .order('sort_order', { ascending: true });

            // Map catalog products to Adiso format
            let mappedAdisos: Adiso[] = [];

            if (productsData) {
                mappedAdisos = productsData.map((p: any) => ({
                    id: p.id,
                    titulo: p.title || '',
                    descripcion: p.description || '',
                    precio: p.price,
                    imagenesUrls: Array.isArray(p.images)
                        ? p.images.map((img: any) => typeof img === 'string' ? img : img.url)
                        : [],
                    imagenUrl: Array.isArray(p.images) && p.images.length > 0
                        ? (typeof p.images[0] === 'string' ? p.images[0] : p.images[0].url)
                        : '',
                    slug: p.id, // Using ID as slug for product details for now
                    categoria: p.category || 'productos',
                    user_id: profileData.user_id,
                    contacto: profileData.contact_phone || '',
                    ubicacion: profileData.contact_address || '',
                    fechaPublicacion: p.created_at ? new Date(p.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                    horaPublicacion: p.created_at ? new Date(p.created_at).toLocaleTimeString() : new Date().toLocaleTimeString()
                }));
            }

            // Also load legacy adisos if needed? 
            // The previous code loaded adisos from 'adisos' table.
            // Let's verify if we should merge them or just use catalog.
            // The user seems to be moving towards "Catalog".
            // But let's keep legacy adisos for now if they exist.

            /* 
            const { data: ads } = await supabase!
                .from('adisos')
                .select('*')
                .eq('user_id', profileData.user_id)
                .eq('esta_activo', true)
                .order('fecha_publicacion', { ascending: false });

            if (ads) {
                setAdisos([...mappedAdisos, ...ads as Adiso[]]);
            } else {
                setAdisos(mappedAdisos);
            }
            */

            // Just usage of mappedAdisos for now based on 'mi-negocio' logic
            setAdisos(mappedAdisos);

            // Track page view
            trackEvent('page_view', profileData.id);

        } catch (error) {
            console.error('Error loading business:', error);
        } finally {
            setLoading(false);
        }
    };

    const trackEvent = async (eventType: string, businessId: string, productId?: string) => {
        try {
            await supabase!.from('page_analytics').insert({
                business_profile_id: businessId,
                event_type: eventType,
                product_id: productId,
                session_id: getSessionId(),
                user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
                referrer: typeof document !== 'undefined' ? document.referrer : ''
            });
        } catch (error) {
            console.error('Analytics error:', error);
        }
    };

    const getSessionId = () => {
        if (typeof sessionStorage === 'undefined') return 'ssr-session';
        let sessionId = sessionStorage.getItem('session_id');
        if (!sessionId) {
            sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            sessionStorage.setItem('session_id', sessionId);
        }
        return sessionId;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="w-16 h-16 border-4 border-slate-200 border-t-[var(--brand-color)] rounded-full animate-spin" />
            </div>
        );
    }

    if (!business) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
                <h1 className="text-2xl font-bold text-slate-800 mb-2">Negocio no encontrado</h1>
                <p className="text-slate-500 mb-6">La página que buscas no existe o ha sido movida.</p>
                <button
                    onClick={() => router.push('/')}
                    className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-black transition-colors"
                >
                    Volver al inicio
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <BusinessPublicView
                profile={business}
                adisos={adisos}
                // isOwner is calculated inside the component based on current user
                // but we can pass edit callbacks if we want to enable inline editing for owners here too
                // For now, let's keep it view-only unless the component enables it via internal isOwner check
                onEditPart={(part) => {
                    if (user?.id === business.user_id) {
                        router.push('/mi-negocio');
                    }
                }}
                onEditProduct={(product) => {
                    if (user?.id === business.user_id) {
                        router.push('/mi-negocio');
                    }
                }}
            />
        </div>
    );
}
