'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { BusinessProfile } from '@/types/business';
import BusinessPublicView from '@/components/business/BusinessPublicView';
import { useAuth } from '@/hooks/useAuth';
import { EditorSteps } from '../../mi-negocio/components/EditorSteps';
import { cn } from '@/lib/utils';

import ChatbotGuide from '@/components/business/ChatbotGuide';
import { ProductEditor } from '@/components/business/ProductEditor';
import SimpleCatalogAdd from '@/components/business/SimpleCatalogAdd';

import { useToast } from '@/hooks/useToast';
import { useBusinessData } from '@/hooks/useBusinessData';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export default function PublicBusinessPage({
    params,
    searchParams,
}: {
    params: { slug: string };
    searchParams: { [key: string]: string | string[] | undefined };
}) {
    const slug = params.slug;
    const { user } = useAuth();
    const { success } = useToast();
    const { isOnline, justCameOnline } = useNetworkStatus();

    // Editing State
    const [isEditing, setIsEditing] = useState(false);
    const [activeStep, setActiveStep] = useState(0);
    const [saving, setSaving] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any>(null);

    // Modals state
    const [showProductModal, setShowProductModal] = useState(false);
    const [showAddProductModal, setShowAddProductModal] = useState(false);

    // Chatbot State
    const [chatbotMinimized, setChatbotMinimized] = useState(true);

    // Auto-open editor if requested
    useEffect(() => {
        if (searchParams?.edit === 'true') {
            setIsEditing(true);
        }
    }, [searchParams]);

    // ─────────────────────────────────────────────────────────────────────
    // DATOS CON CACHÉ OFFLINE (el isOwner real se calcula después de cargar)
    // Usamos una check provisional de isOwner para el hook (se corrige internamente)
    // ─────────────────────────────────────────────────────────────────────
    const {
        business,
        adisos,
        catalogProducts,
        loading,
        revalidating,
        fromCache,
        isStale,
        reloadCatalog,
        updateBusiness,
    } = useBusinessData(slug, false);

    // Derived owner check (necesita que el business ya esté cargado)
    const isOwner = Boolean(user?.id && business?.user_id && user.id === business.user_id);

    // Reload catalog when ownership is confirmed to ensure drafts are visible
    useEffect(() => {
        if (business?.id && isOwner && isOnline) {
            reloadCatalog(business.id);
        }
    }, [isOwner, business?.id, isOnline, reloadCatalog]);

    const trackEvent = useCallback(async (eventType: string, businessId: string, productId?: string) => {
        if (!isOnline) return; // No trackear sin internet
        try {
            await supabase!.from('page_analytics').insert({
                business_profile_id: businessId,
                event_type: eventType,
                product_id: productId,
                session_id: getSessionId(),
                user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
                referrer: typeof document !== 'undefined' ? document.referrer : '',
            });
        } catch (error) {
            // Silenciar errores de analytics offline
        }
    }, [isOnline]);

    const getSessionId = () => {
        if (typeof sessionStorage === 'undefined') return 'ssr-session';
        let sessionId = sessionStorage.getItem('session_id');
        if (!sessionId) {
            sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            sessionStorage.setItem('session_id', sessionId);
        }
        return sessionId;
    };

    // Trackear vista cuando se carga el negocio
    useEffect(() => {
        if (business?.id && isOnline) {
            trackEvent('page_view', business.id);
        }
    }, [business?.id, isOnline, trackEvent]);

    const handleProductSave = async (updatedProduct: any) => {
        if (business?.id) {
            await reloadCatalog(business.id);
            success('Producto guardado correctamente');
        }
        setShowProductModal(false);
        setEditingProduct(null);
    };

    // ─── LOADING STATE ────────────────────────────────────
    // Solo mostramos loading si no tenemos ningún dato (ni caché ni red)
    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-400 font-medium">Cargando...</p>
                    {!isOnline && (
                        <p className="text-sm text-amber-500 mt-2">Sin conexión — buscando datos guardados</p>
                    )}
                </div>
            </div>
        );
    }

    // ─── NOT FOUND STATE ──────────────────────────────────
    if (!business) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center max-w-sm mx-auto p-8">
                    {!isOnline ? (
                        <>
                            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728M5.636 5.636a9 9 0 000 12.728M8.879 8.879a5 5 0 000 7.072m6.242-7.072a5 5 0 010 7.072" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-bold text-slate-800 mb-2">Sin conexión</h2>
                            <p className="text-slate-500 text-sm">
                                No hay datos guardados de este negocio. Conéctate a internet para cargarlo por primera vez.
                            </p>
                        </>
                    ) : (
                        <>
                            <h2 className="text-xl font-bold text-slate-800 mb-2">Negocio no encontrado</h2>
                            <p className="text-slate-500 text-sm">No encontramos ningún negocio con este enlace.</p>
                        </>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 relative flex flex-col md:flex-row overflow-x-hidden">

            {/* ─── BANNERS DE ESTADO ──────────────────────────────────────── */}

            {/* Offline banner: datos del caché */}
            {!isOnline && fromCache && (
                <div className="fixed top-0 left-0 right-0 z-[200] bg-amber-500 text-white text-center text-sm py-2 px-4 font-medium animate-in slide-in-from-top duration-300">
                    📴 Sin conexión — mostrando datos guardados
                    {isStale && <span className="ml-2 text-amber-100 text-xs">(pueden no estar actualizados)</span>}
                </div>
            )}

            {/* Online banner: acaba de reconectarse */}
            {justCameOnline && (
                <div className="fixed top-0 left-0 right-0 z-[200] bg-green-500 text-white text-center text-sm py-2 px-4 font-medium animate-in slide-in-from-top duration-300">
                    ✅ Conexión restaurada — actualizando datos...
                </div>
            )}

            {/* Revalidating indicator (subtle) */}
            {revalidating && isOnline && (
                <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[200] bg-slate-800/90 text-white text-xs py-1.5 px-4 rounded-full backdrop-blur-sm flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Actualizando...
                </div>
            )}

            {/* --- EDITOR SIDEBAR --- */}
            <div className={cn(
                "fixed inset-y-0 left-0 z-[60] w-full md:w-[450px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out border-r border-slate-200",
                isEditing ? "translate-x-0" : "-translate-x-full"
            )}>
                {isEditing && business && (
                    <EditorSteps
                        profile={business}
                        setProfile={(p) => {
                            if (typeof p === 'function') {
                                updateBusiness(prev => (p as any)(prev));
                            } else {
                                updateBusiness(() => p as BusinessProfile);
                            }
                        }}
                        saving={saving}
                        catalogProducts={catalogProducts}
                        activeStep={activeStep}
                        setActiveStep={setActiveStep}
                        onAddProduct={() => setShowAddProductModal(true)}
                        editingProduct={editingProduct}
                        setEditingProduct={(product) => {
                            setEditingProduct(product);
                            setShowProductModal(true);
                        }}
                        onRefreshCatalog={() => business?.id && reloadCatalog(business.id)}
                        onToggleView={() => setIsEditing(false)}
                        isPublished={!!business?.is_published}
                    />
                )}
            </div>

            {/* --- MAIN CONTENT --- */}
            <div className={cn(
                "flex-1 min-w-0 transition-all duration-300",
                isEditing ? "md:ml-[450px]" : ""
            )}>
                <BusinessPublicView
                    profile={business}
                    adisos={adisos}
                    editMode={isEditing || isOwner}
                    onEditPart={(part) => {
                        setIsEditing(true);
                        if (part === 'logo' || part === 'visual') setActiveStep(1);
                        if (part === 'add-product') {
                            setActiveStep(2);
                            setShowAddProductModal(true);
                        }
                    }}
                    onEditProduct={(productAdiso) => {
                        setIsEditing(true);
                        setActiveStep(2);
                        const fullProduct = catalogProducts.find(p => p.id === productAdiso.id);
                        setEditingProduct(fullProduct || productAdiso);
                        setShowProductModal(true);
                    }}
                    chatbotMinimized={chatbotMinimized}
                    onToggleChatbot={() => setChatbotMinimized(!chatbotMinimized)}
                />

                {/* --- CHATBOT GUIDE --- */}
                {isOwner && (
                    <>
                        <ChatbotGuide
                            profile={business}
                            onUpdate={(field, value) =>
                                updateBusiness(prev => ({ ...prev, [field]: value }))
                            }
                            onComplete={() => setChatbotMinimized(true)}
                            isMinimized={chatbotMinimized}
                            onToggleMinimize={() => setChatbotMinimized(!chatbotMinimized)}
                            hideTriggerButton={true}
                        />
                    </>
                )}
            </div>

            {/* Overlay for mobile when editing */}
            {isEditing && (
                <div
                    className="fixed inset-0 bg-black/20 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setIsEditing(false)}
                />
            )}

            {/* Product Edit Modal Overlay */}
            {(showProductModal || editingProduct) && user && business?.id && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <ProductEditor
                            key={editingProduct?.id || 'new-product'}
                            product={editingProduct === 'new' ? null : editingProduct}
                            businessProfileId={business.id}
                            userId={user.id}
                            adisos={adisos}
                            onSave={handleProductSave}
                            onCancel={() => {
                                setShowProductModal(false);
                                setEditingProduct(null);
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Simple Product Add Modal */}
            {showAddProductModal && business?.id && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in zoom-in-95 duration-300">
                    <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl overflow-hidden">
                        <SimpleCatalogAdd
                            businessProfileId={business.id}
                            onSuccess={() => {
                                reloadCatalog(business.id);
                                setShowAddProductModal(false);
                                success('Producto añadido correctamente');
                            }}
                            onClose={() => setShowAddProductModal(false)}
                            adisos={adisos}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
