'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getBusinessProfileBySlug, saveBusinessProfile } from '@/lib/business';
import { BusinessProfile } from '@/types/business';
import { Adiso } from '@/types';
import BusinessPublicView from '@/components/business/BusinessPublicView';
import { useAuth } from '@/hooks/useAuth';
import { EditorSteps } from '../../mi-negocio/components/EditorSteps';
import { IconEdit, IconX, IconEye } from '@/components/Icons';
import { cn } from '@/lib/utils';

export default function PublicBusinessPage({ params }: { params: { slug: string } }) {
    const router = useRouter();
    const slug = params.slug;
    const { user } = useAuth();

    const [business, setBusiness] = useState<BusinessProfile | null>(null);
    const [adisos, setAdisos] = useState<Adiso[]>([]);
    const [loading, setLoading] = useState(true);

    // Editing State
    const [isEditing, setIsEditing] = useState(false);
    const [activeStep, setActiveStep] = useState(0);
    const [saving, setSaving] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any>(null);
    const [catalogProducts, setCatalogProducts] = useState<any[]>([]);

    // Derived owner check
    const isOwner = user?.id && business?.user_id && user.id === business.user_id;

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
                console.log('Profile not found for slug:', slug);
                setLoading(false);
                return;
            }

            setBusiness(profileData);
            loadCatalog(profileData.id);

            // Track page view
            trackEvent('page_view', profileData.id);

        } catch (error) {
            console.error('Error loading business:', error);
            setLoading(false);
        }
    };

    const loadCatalog = async (businessId: string) => {
        try {
            const { data: productsData } = await supabase!
                .from('catalog_products')
                .select('*')
                .eq('business_profile_id', businessId)
                .eq('status', 'published')
                .order('sort_order', { ascending: true });

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
                    slug: p.id,
                    categoria: p.category || 'productos',
                    user_id: business?.user_id, // Might be null initially but updated later
                    contacto: business?.contact_phone || '',
                    ubicacion: business?.contact_address || '',
                    fechaPublicacion: p.created_at ? new Date(p.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                    horaPublicacion: p.created_at ? new Date(p.created_at).toLocaleTimeString() : new Date().toLocaleTimeString()
                }));
            }
            setAdisos(mappedAdisos);
            setCatalogProducts(productsData || []);
        } catch (e) {
            console.error("Error loading catalog:", e);
        } finally {
            setLoading(false);
        }
    };

    // Auto-save effect
    useEffect(() => {
        if (!business || !isOwner) return;

        const timer = setTimeout(async () => {
            setSaving(true);
            try {
                await saveBusinessProfile(business);
            } catch (e) {
                console.error("Save error:", e);
            } finally {
                setSaving(false);
            }
        }, 3000); // 3 seconds debounce

        return () => clearTimeout(timer);
    }, [business, isOwner]);

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
        <div className="min-h-screen bg-slate-50 relative flex flex-col md:flex-row overflow-x-hidden">

            {/* --- EDITOR SIDEBAR (Only visible when isEditing) --- */}
            <div className={cn(
                "fixed inset-y-0 left-0 z-50 w-full md:w-[450px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out border-r border-slate-200",
                isEditing ? "translate-x-0" : "-translate-x-full"
            )}>
                {isEditing && (
                    <EditorSteps
                        profile={business}
                        setProfile={setBusiness}
                        saving={saving}
                        catalogProducts={catalogProducts}
                        activeStep={activeStep}
                        setActiveStep={setActiveStep}
                        onAddProduct={() => setEditingProduct('new')}
                        editingProduct={editingProduct}
                        setEditingProduct={setEditingProduct}
                        onRefreshCatalog={() => loadCatalog(business.id)}
                        onToggleView={() => setIsEditing(false)}
                        isPublished={true}
                    />
                )}
            </div>

            {/* --- MAIN CONTENT (Preview / Public View) --- */}
            <div className={cn(
                "flex-1 min-w-0 transition-all duration-300",
                isEditing ? "md:ml-[450px]" : ""
            )}>
                <BusinessPublicView
                    profile={business}
                    adisos={adisos}
                    editMode={isEditing}
                    // When clicking "inline edit" on view, open sidebar
                    onEditPart={(part) => {
                        setIsEditing(true);
                        // Map parts to steps
                        if (part === 'logo' || part === 'visual') setActiveStep(1);
                        if (part === 'add-product') {
                            setActiveStep(2); // Catalog
                            setEditingProduct('new');
                        }
                    }}
                    onEditProduct={(product) => {
                        setIsEditing(true);
                        setActiveStep(2); // Catalog Step
                        // We need to find the raw product data... 
                        setEditingProduct(product); // This might need conversion if types don't match perfect
                    }}
                />

                {/* --- FLOATING EDIT BUTTON REMOVED (Moved to BusinessPublicView Actions) --- */}
            </div>

            {/* Overlay for mobile when editing */}
            {isEditing && (
                <div
                    className="fixed inset-0 bg-black/20 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setIsEditing(false)}
                />
            )}
        </div>
    );
}
