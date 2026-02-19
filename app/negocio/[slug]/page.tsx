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

import ChatbotGuide from '@/components/business/ChatbotGuide';
import { ProductEditor } from '@/components/business/ProductEditor';
import SimpleCatalogAdd from '@/components/business/SimpleCatalogAdd';

import { useToast } from '@/hooks/useToast'; // Add import

export default function PublicBusinessPage({ params, searchParams }: { params: { slug: string }, searchParams: { [key: string]: string | string[] | undefined } }) {
    const router = useRouter();
    const slug = params.slug;
    const { user } = useAuth();
    const { success } = useToast();

    const [business, setBusiness] = useState<BusinessProfile | null>(null);
    const [adisos, setAdisos] = useState<Adiso[]>([]);
    const [loading, setLoading] = useState(true);

    // Editing State
    const [isEditing, setIsEditing] = useState(false);
    const [activeStep, setActiveStep] = useState(0);
    const [saving, setSaving] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any>(null);
    const [catalogProducts, setCatalogProducts] = useState<any[]>([]);

    // Modals state
    const [showProductModal, setShowProductModal] = useState(false);
    const [showAddProductModal, setShowAddProductModal] = useState(false);

    // Chatbot State
    const [chatbotMinimized, setChatbotMinimized] = useState(true);

    // Derived owner check
    const isOwner = Boolean(user?.id && business?.user_id && user.id === business.user_id);

    useEffect(() => {
        if (slug) {
            loadBusinessData();
        }
        // Auto-open editor if requested
        if (searchParams?.edit === 'true') {
            setIsEditing(true);
        }
    }, [slug, searchParams]);

    // Reload catalog when ownership is confirmed to ensure drafts are visible
    useEffect(() => {
        if (business?.id) {
            loadCatalog(business.id);
        }
    }, [isOwner, business?.id]);

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

    const loadBusinessData = async () => {
        try {
            const profileData = await getBusinessProfileBySlug(slug);

            if (!profileData) {
                setLoading(false);
                return;
            }

            setBusiness(profileData);
            loadCatalog(profileData.id);
            trackEvent('page_view', profileData.id);

        } catch (error) {
            console.error('Error loading business:', error);
            setLoading(false);
        }
    };

    const loadCatalog = async (businessId: string) => {
        try {
            let query = supabase!
                .from('catalog_products')
                .select('*')
                .eq('business_profile_id', businessId)
                // Sort by creation date descending to show new products first
                .order('created_at', { ascending: false });

            // If not owner, ONLY show published.
            if (!isOwner) {
                query = query.eq('status', 'published');
            }

            const { data: productsData } = await query;

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
                    user_id: business?.user_id || p.business_profile_id,
                    contacto: business?.contact_phone || '',
                    ubicacion: business?.contact_address || '',
                    fechaPublicacion: p.created_at ? new Date(p.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                    horaPublicacion: p.created_at ? new Date(p.created_at).toLocaleTimeString() : new Date().toLocaleTimeString(),
                    status: p.status
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

    const handleProductSave = async (updatedProduct: any) => {
        if (business?.id) {
            await loadCatalog(business.id);
            success('Producto guardado correctamente');
        }
        setShowProductModal(false);
        setEditingProduct(null);
    };


    return (
        <div className="min-h-screen bg-slate-50 relative flex flex-col md:flex-row overflow-x-hidden">

            {/* --- EDITOR SIDEBAR --- */}
            <div className={cn(
                "fixed inset-y-0 left-0 z-[60] w-full md:w-[450px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out border-r border-slate-200",
                isEditing ? "translate-x-0" : "-translate-x-full"
            )}>
                {isEditing && business && (
                    <EditorSteps
                        profile={business}
                        setProfile={setBusiness}
                        saving={saving}
                        catalogProducts={catalogProducts}
                        activeStep={activeStep}
                        setActiveStep={setActiveStep}
                        onAddProduct={() => setShowAddProductModal(true)} // Changed to open SimpleCatalogAdd
                        editingProduct={editingProduct}
                        setEditingProduct={(product) => {
                            setEditingProduct(product);
                            setShowProductModal(true);
                        }}
                        onRefreshCatalog={() => business?.id && loadCatalog(business.id)}
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
                    editMode={isEditing || isOwner} // Allow inline edits if owner
                    onEditPart={(part) => {
                        setIsEditing(true);
                        if (part === 'logo' || part === 'visual') setActiveStep(1);
                        if (part === 'add-product') {
                            setActiveStep(2);
                            setShowAddProductModal(true); // Changed to open SimpleCatalogAdd
                        }
                    }}
                    onEditProduct={(productAdiso) => {
                        setIsEditing(true);
                        setActiveStep(2);
                        // Find full product data
                        const fullProduct = catalogProducts.find(p => p.id === productAdiso.id);
                        setEditingProduct(fullProduct || productAdiso);
                        setShowProductModal(true);
                    }}
                />

                {/* --- CHATBOT GUIDE --- */}
                {isOwner && (
                    <>
                        <ChatbotGuide
                            profile={business}
                            onUpdate={(field, value) => setBusiness(prev => prev ? ({ ...prev, [field]: value }) : null)}
                            onComplete={() => setChatbotMinimized(true)}
                            isMinimized={chatbotMinimized}
                            onToggleMinimize={() => setChatbotMinimized(!chatbotMinimized)}
                        />
                        {/* Floating Chat Button (Re-open) */}
                        {chatbotMinimized && (
                            <button
                                onClick={() => setChatbotMinimized(false)}
                                className="fixed bottom-48 right-6 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center z-[70] hover:scale-110 transition-transform bg-white text-blue-600 border border-blue-100"
                                title="Asistente IA"
                            >
                                <span className="text-2xl">💬</span>
                            </button>
                        )}
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
                                loadCatalog(business.id); // Fixed from business!.id to business.id
                                setShowAddProductModal(false);
                                success('Producto añadido correctamente');
                            }}
                            onClose={() => setShowAddProductModal(false)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
