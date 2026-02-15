'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { createBusinessProfile, getBusinessProfile, updateBusinessProfile, checkSlugAvailability } from '@/lib/business';
import { BusinessProfile } from '@/types/business';
import { cn } from '@/lib/utils';
import {
    IconCopy, IconEye, IconEdit, IconExternalLink,
    IconWhatsapp, IconMapMarkerAlt, IconEnvelope,
    IconStore, IconCheck, IconClose, IconRobot,
    IconInstagram, IconFacebook, IconTiktok, IconQrcode, IconBox
} from '@/components/Icons';
import AuthModal from '@/components/AuthModal';
import BusinessPublicView from '@/components/business/BusinessPublicView';
import { supabase, dbToAdiso } from '@/lib/supabase';
import { Adiso } from '@/types';
import { saveAdiso } from '@/lib/storage';
import { useDebounce } from '@/hooks/useDebounce';
import { useToast } from '@/hooks/useToast';
import dynamic from 'next/dynamic';

const FormularioPublicar = dynamic(() => import('@/components/FormularioPublicar'), {
    ssr: false,
    loading: () => <div className="p-8 text-center text-slate-500">Cargando formulario...</div>
});
import FormularioCatalogo from '@/components/business/FormularioCatalogo';
import { EditorSteps } from './components/EditorSteps';

function BusinessBuilderPageContent() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toasts, removeToast, success, error } = useToast();
    const [profileLoading, setProfileLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);

    const [profile, setProfile] = useState<Partial<BusinessProfile>>({
        name: '',
        slug: '',
        description: '',
        contact_whatsapp: '',
        contact_email: '',
        contact_phone: '',
        contact_address: '',
        logo_url: '',
        banner_url: '',
        theme_color: '#3c6997',
        social_links: [],
        custom_blocks: [],
        business_hours: {},
        is_published: false
    });
    const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            setProfileLoading(false);
            return;
        }

        async function loadProfile() {
            try {
                const existing = await getBusinessProfile(user!.id);
                if (existing) {
                    setProfile(existing);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setProfileLoading(false);
            }
        }
        loadProfile();
    }, [user, authLoading]);



    // Handle Deep Linking from Public View Edit Icons
    useEffect(() => {
        const editPart = searchParams.get('edit');
        if (editPart) {
            handleEditPart(editPart);
        }
    }, [searchParams, profileLoading]);

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        try {
            let result;
            if (profile.id) {
                // Update existing
                result = await updateBusinessProfile(user.id, profile);
                // We DO NOT setProfile(result) here to avoid overwriting user's typing with old server state
                // unless we returned specific computed fields, but for now we trust local state.
            } else {
                // Create new
                result = await createBusinessProfile({ ...profile, user_id: user.id });
                // For creation, we MUST update to get the ID.
                if (result) {
                    setProfile(result);
                }
            }
        } catch (e) {
            console.error(e);
            // alert('Error al guardar. Por favor intenta de nuevo.'); // Silent fail for autosave is better, maybe toast?
        } finally {
            setSaving(false);
        }
    };

    const handleTogglePublish = async () => {
        if (!user) return;

        // Validation
        if (!profile.name) {
            alert('Por favor ingresa un Nombre Comercial primero.');
            return;
        }
        if (!profile.slug) {
            alert('Por favor define una URL Personalizada primero.');
            return;
        }

        const newStatus = !profile.is_published;
        const updatedProfile = { ...profile, is_published: newStatus };

        // Optimistic Update
        setProfile(updatedProfile);
        setSaving(true);

        try {
            let result;
            if (profile.id) {
                result = await updateBusinessProfile(user.id, updatedProfile);
            } else {
                result = await createBusinessProfile({ ...updatedProfile, user_id: user.id });
            }

            if (result) {
                setProfile(result);
            }
        } catch (e) {
            console.error("Error toggling publish:", e);
            alert('No se pudo actualizar el estado. Verifica tu conexión.');
            setProfile(p => ({ ...p, is_published: !newStatus })); // Revert
        } finally {
            setSaving(false);
        }
    };

    const { showToast } = useToast();
    const [userAdisos, setUserAdisos] = useState<Adiso[]>([]);
    const [catalogProducts, setCatalogProducts] = useState<any[]>([]);
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
    const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor'); // For mobile
    const [activeStep, setActiveStep] = useState(0);
    const [showPublishModal, setShowPublishModal] = useState(false);

    // Fetch user ads and catalog products for preview
    useEffect(() => {
        if (!user || !supabase) return;

        async function fetchUserAds() {
            // Fetch Legacy Adisos
            const { data: adsData } = await supabase!
                .from('adisos')
                .select('*')
                .eq('user_id', user!.id)
                .order('fecha_publicacion', { ascending: false })
                .limit(10);

            if (adsData) {
                setUserAdisos(adsData.map(dbToAdiso));
            }

            // Fetch New Catalog Products
            const { data: catData } = await supabase!
                .from('catalog_products')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(20);

            // Note: In a real scenario we'd filter by business_profile_id which we get from the profile state
            // But for now, if we have catData, we filter it locally or rely on the query if we had the ID ready
            if (catData && profile.id) {
                setCatalogProducts(catData.filter(p => p.business_profile_id === profile.id));
            } else if (catData) {
                setCatalogProducts(catData); // Fallback for initial load
            }
        }
        fetchUserAds();
    }, [user, profile.id]);

    // Auto-save: Debounce profile changes
    const debouncedProfile = useDebounce(profile, 1500);
    const [lastSavedProfile, setLastSavedProfile] = useState<string>('');

    // Auto-save Logic
    useEffect(() => {
        if (!user || profileLoading || !profile.id || !debouncedProfile) return;

        // Check if there are actual changes to save
        const currentProfileStr = JSON.stringify(debouncedProfile);

        // Prevent saving if nothing changed from last save (or initial load)
        if (currentProfileStr === lastSavedProfile) return;

        const autoSave = async () => {
            setSaving(true);
            try {
                if (profile.id) {
                    await updateBusinessProfile(user.id, debouncedProfile);
                    setLastSavedProfile(currentProfileStr);
                }
            } catch (e) {
                console.error("Auto-save error:", e);
            } finally {
                setSaving(false);
            }
        };

        autoSave();
    }, [debouncedProfile, user, profile.id]);

    const handleCopyLink = () => {
        if (!profile.slug) return;
        const url = `${window.location.origin}/negocio/${profile.slug}`;
        navigator.clipboard.writeText(url);
        showToast('¡Enlace copiado al portapapeles!', 'success');
    };

    const handleDownloadQR = () => {
        if (!profile.slug) return;
        const url = `${window.location.origin}/negocio/${profile.slug}`;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(url)}`;

        // Create a temporary link to download
        const link = document.createElement('a');
        link.href = qrUrl;
        link.download = `qr-${profile.slug}.png`;
        link.target = '_blank'; // For safety
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Abriendo código QR...', 'success');
    };

    const handleNameChange = (newName: string) => {
        const updates: any = { name: newName };
        if (!slugManuallyEdited) {
            updates.slug = newName.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
            handleSlugCheck(updates.slug);
        }
        setProfile(p => ({ ...p, ...updates }));
    };

    const handleSlugCheck = async (slug: string) => {
        const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '');
        // Update local state immediately for responsiveness
        setProfile(p => ({ ...p, slug: cleanSlug }));

        if (cleanSlug.length < 3) {
            setSlugAvailable(false);
            return;
        }

        // If it's my own slug, it is available
        if (profile.id && cleanSlug === profile.slug) {
            setSlugAvailable(true);
            return;
        }

        const isAvailable = await checkSlugAvailability(cleanSlug);
        setSlugAvailable(isAvailable);
    };

    const handleEditPart = (part: string) => {
        // Map part names to step indices
        const partToStep: Record<string, number> = {
            'identity': 0,
            'logo': 1,
            'visual': 1,
            'banner': 1,
            'catalog': 2,
            'add-product': 2,
            'contact': 3,
            'hours': 4,
            'social': 5,
            'marketing': 6
        };

        if (partToStep[part] !== undefined) {
            setActiveStep(partToStep[part]);

            // Special case: if adding product, open modal too
            if (part === 'add-product') {
                setShowPublishModal(true);
            }

            // If on mobile, switch back to editor tab
            if (window.innerWidth < 768) {
                setActiveTab('editor');
            }
        }
    };

    // --- Dummy Data for Preview ---
    const DUMMY_PROFILE: Partial<BusinessProfile> = {
        name: 'Tu Nombre de Negocio',
        description: 'Esta es una descripción de ejemplo. Aquí podrás contar la historia de tu negocio, tus horarios de atención y lo que hace únicos a tus productos. ¡Escribe en el panel de la izquierda para ver los cambios en tiempo real!',
        logo_url: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=400&h=400&fit=crop',
        banner_url: 'https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?w=1200&h=600&fit=crop',
        contact_address: 'Av. Principal 123, Tu Ciudad',
        contact_whatsapp: '999999999',
        contact_email: 'contacto@ejemplo.com',
        theme_color: '#3c6997'
    };

    const DUMMY_ADISOS: Adiso[] = [
        { id: '1', titulo: 'Producto Ejemplo 1', descripcion: 'Descripción corta del producto.', imagenesUrls: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400'], imagenUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400', categoria: 'productos', fechaPublicacion: new Date().toISOString(), horaPublicacion: '12:00', ubicacion: 'Cusco', contacto: '999999999' },
        { id: '2', titulo: 'Servicio Profesional', descripcion: 'Ofrecemos el mejor servicio.', imagenesUrls: ['https://images.unsplash.com/photo-1521791136064-7986c2920216?w=400'], imagenUrl: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=400', categoria: 'servicios', fechaPublicacion: new Date().toISOString(), horaPublicacion: '12:00', ubicacion: 'Cusco', contacto: '999999999' },
        { id: '3', titulo: 'Oferta Especial', descripcion: 'Aprovecha esta promoción.', imagenesUrls: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'], imagenUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400', categoria: 'productos', fechaPublicacion: new Date().toISOString(), horaPublicacion: '12:00', ubicacion: 'Cusco', contacto: '999999999' },
    ];

    // Merge actual profile with dummy data for rich preview
    const previewProfile = {
        ...DUMMY_PROFILE,
        ...Object.fromEntries(Object.entries(profile).filter(([_, v]) => v !== '' && v !== null && v !== undefined)),
        // Ensure strictly controlled fields from profile take precedence if they exist
        ...(profile.name ? { name: profile.name } : {}),
        ...(profile.slug ? { slug: profile.slug } : {}),
        ...(profile.description ? { description: profile.description } : {}),
        ...(profile.logo_url ? { logo_url: profile.logo_url } : {}),
        ...(profile.banner_url ? { banner_url: profile.banner_url } : {}),
        ...(profile.theme_color ? { theme_color: profile.theme_color } : {}),
        ...(profile.font_family ? { font_family: profile.font_family } : {}),
        social_links: profile.social_links || [],
        announcement_text: profile.announcement_text,
        announcement_active: profile.announcement_active,
        is_vacation_mode: profile.is_vacation_mode,
        is_verified: true, // Preview verified badge
        show_contact_form: profile.show_contact_form !== false,
        business_hours: profile.business_hours || {}, // Ensure structure
    } as BusinessProfile;

    // Converted catalog products for preview
    const convertedCatalog = catalogProducts.map(p => ({
        id: p.id,
        titulo: p.title,
        descripcion: p.description || `Precio: S/ ${p.price?.toFixed(2)}`,
        imagenesUrls: p.images?.map((img: any) => img.url) || [],
        imagenUrl: p.images?.[0]?.url,
        categoria: p.category || 'Varios',
        fechaPublicacion: p.created_at,
        horaPublicacion: '',
        ubicacion: profile.contact_address || '',
        contacto: profile.contact_whatsapp || '',
        is_catalog_product: true // Metadata for later use if needed
    } as any));

    // Use dummy ads if user has none, to show catalog potential
    // Combine both legacy and new catalog products
    const combinedAdisos = [...convertedCatalog, ...userAdisos];
    const previewAdisos = combinedAdisos.length > 0 ? combinedAdisos : DUMMY_ADISOS;

    if (authLoading || profileLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-secondary)]">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-[var(--accent-color)] opacity-20"></div>
                    <div className="text-[var(--text-secondary)] font-medium">Cargando tu imperio digital...</div>
                </div>
            </div>
        );
    }



    if (!user) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-secondary)] p-4">
                <div className="bg-[var(--bg-primary)] p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-[var(--border-subtle)]">
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <IconStore size={32} />
                    </div>
                    <h1 className="text-2xl font-bold mb-3 text-[var(--text-primary)]">Comienza tu Negocio Digital</h1>
                    <p className="mb-8 text-[var(--text-secondary)]">
                        Estás a un paso de tener tu propia página web profesional. Crea tu cuenta gratis o inicia sesión para continuar.
                    </p>
                    <button
                        onClick={() => setShowAuthModal(true)}
                        className="w-full py-3 px-6 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-xl font-bold hover:opacity-90 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 mb-4"
                    >
                        Crear Cuenta / Iniciar Sesión
                    </button>
                    <button
                        onClick={() => router.push('/')}
                        className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors underline"
                    >
                        Volver al Inicio
                    </button>
                </div>
                <AuthModal
                    abierto={showAuthModal}
                    onCerrar={() => setShowAuthModal(false)}
                    modoInicial="signup"
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 flex flex-col">

            {/* Top Bar - Simplified & Functional */}
            <div className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm h-16">
                <div className="max-w-[1920px] mx-auto px-4 h-full flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <button onClick={() => router.push('/')} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                            <IconStore size={20} className="text-slate-600" />
                        </button>
                        <div className="h-6 w-px bg-slate-300 mx-1 hidden md:block"></div>
                        <h1 className="text-lg font-bold text-slate-800 hidden md:block">Editor de Negocio</h1>
                        <div className="hidden lg:flex items-center gap-2 ml-4 px-3 py-1 bg-slate-100 rounded-full text-xs font-medium text-slate-600 border border-slate-200">
                            <IconEye size={12} />
                            <span>{profile.view_count || 0} visitas</span>
                        </div>

                        {saving && (
                            <span className="text-xs text-slate-400 animate-pulse flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-full">
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full" /> Guardando...
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Mobile Toggle: Show "Edit" button if in Preview, "Close" if in Editor */}
                        <div className="flex md:hidden mr-2">
                            <button
                                onClick={() => setActiveTab(activeTab === 'preview' ? 'editor' : 'preview')}
                                className={cn(
                                    "px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 transition-all shadow-md",
                                    activeTab === 'preview'
                                        ? "bg-slate-900 text-white"
                                        : "bg-white text-slate-700 border border-slate-200"
                                )}
                            >
                                {activeTab === 'preview' ? (
                                    <><IconEdit size={16} /> Editar Página</>
                                ) : (
                                    <><IconClose size={16} /> Ver Página</>
                                )}
                            </button>
                        </div>

                        {profile.slug && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        // TODO: Open a nice modal with the downloadable QR
                                        const url = `${window.location.origin}/negocio/${profile.slug}`;
                                        window.open(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`, '_blank');
                                    }}
                                    className="hidden md:flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 rounded-lg transition-all"
                                    title="Ver código QR"
                                >
                                    <IconQrcode size={16} />
                                    <span className="hidden lg:inline">QR</span>
                                </button>
                                <button
                                    onClick={() => {
                                        const url = `${window.location.origin}/negocio/${profile.slug}`;
                                        navigator.clipboard.writeText(url);
                                        showToast('Link copiado al portapapeles', 'success');
                                    }}
                                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 rounded-lg transition-all"
                                >
                                    <IconCopy size={16} />
                                    <span className="hidden lg:inline">Copiar Link</span>
                                </button>
                                <a
                                    href={`/negocio/${profile.slug}`}
                                    target="_blank"
                                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 rounded-lg transition-all"
                                >
                                    <IconExternalLink size={16} />
                                    <span className="hidden lg:inline">Ver</span>
                                </a>
                            </div>
                        )}

                        <div className="h-6 w-px bg-slate-200 mx-2 hidden sm:block"></div>

                        <button
                            onClick={handleTogglePublish}
                            disabled={!profile.name || !profile.slug}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all shadow-sm",
                                profile.is_published
                                    ? "bg-green-100 text-green-700 hover:bg-green-200 border border-green-200"
                                    : "bg-slate-800 text-white hover:bg-slate-700 hover:shadow-md"
                            )}
                        >
                            {profile.is_published ? (
                                <>
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    Publicado
                                </>
                            ) : (
                                "Publicar"
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Split View Container */}
            <div className="flex-1 flex overflow-hidden h-[calc(100vh-64px)] relative">

                {/* LEFT: Editor Panel */}
                {/* LEFT: Editor Panel */}
                <div className={cn(
                    "bg-white border-r border-slate-200 h-full transition-transform duration-300 z-20",
                    // Mobile: Absolute positioning, toggles via translate
                    "absolute inset-0 w-full",
                    activeTab === 'editor' ? "translate-x-0" : "-translate-x-full",
                    // Desktop: Relative positioning, fixed width, always visible
                    "md:relative md:w-[450px] lg:w-[500px] md:translate-x-0 md:inset-auto md:flex-shrink-0"
                )}>
                    <EditorSteps
                        profile={profile as any}
                        setProfile={setProfile as any}
                        saving={saving}
                        userAdisos={userAdisos}
                        catalogProducts={catalogProducts}
                        activeStep={activeStep}
                        setActiveStep={setActiveStep}
                        onAddProduct={() => setShowPublishModal(true)}
                    />
                </div>

                {/* RIGHT: Live Preview */}
                <div className={cn(
                    "bg-slate-100 transition-transform duration-300 z-10",
                    // Mobile: Absolute positioning covers everything
                    "absolute inset-0 w-full h-full",
                    // Desktop: Relative, part of flex layout
                    "md:static md:flex-1 md:transform-none md:translate-x-0 md:w-auto",
                    // Mobile Toggle State
                    activeTab === 'preview' ? "translate-x-0" : "translate-x-full"
                )}>
                    {/* Device Frame Mockup */}
                    <div className="w-full h-full p-0 md:p-8 flex items-center justify-center overflow-hidden relative">
                        <div className="w-full h-full md:max-w-[1400px] bg-white md:rounded-2xl md:shadow-2xl overflow-y-auto custom-scrollbar relative border border-slate-200 block">
                            {/* Browser Mockup Header */}
                            <div className="sticky top-0 z-50 bg-[#f8f9fa] border-b border-slate-200 p-2 flex items-center justify-between gap-4 hidden md:flex h-12 shadow-sm">
                                {/* Navigation Controls */}
                                <div className="flex gap-2 ml-2 text-slate-400">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M3 21v-5h5" /></svg>
                                </div>

                                {/* Address Bar */}
                                <div className="flex-1 max-w-2xl bg-white border border-slate-300 rounded-md px-3 py-1.5 flex items-center gap-2 shadow-sm text-xs text-slate-600 font-medium mx-auto">
                                    <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                    <span className="opacity-50">https://</span>
                                    <span>adis.lat/negocio/{profile.slug || 'tu-negocio'}</span>
                                </div>

                                {/* Window Controls (Subtle) */}
                                <div className="flex gap-1.5 mr-2 opacity-0">
                                    <div className="w-3 h-3 rounded-full bg-slate-300" />
                                    <div className="w-3 h-3 rounded-full bg-slate-300" />
                                </div>
                            </div>

                            {/* The Real Preview Component */}
                            <div className="relative min-h-full bg-white isolate">
                                <BusinessPublicView
                                    profile={previewProfile}
                                    adisos={previewAdisos}
                                    isPreview={true}
                                    onEditPart={handleEditPart}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* --- PUBLISH MODAL --- */}
            {showPublishModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowPublishModal(false)} />
                    <div className="relative bg-white w-full max-w-2xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="font-bold text-slate-800">Agregar Nuevo Producto</h3>
                            <button
                                onClick={() => setShowPublishModal(false)}
                                className="w-8 h-8 rounded-full hover:bg-white flex items-center justify-center transition-colors"
                            >
                                <IconClose size={20} />
                            </button>
                        </div>
                        <div className="p-6">
                            <FormularioCatalogo
                                onSave={async (adiso) => {
                                    console.log('Finalizing product save:', adiso);
                                    try {
                                        // If user is authenticated, we should associate their ID
                                        // Ensure valid contact and location data
                                        const adisoToSave = {
                                            ...adiso,
                                            // Inject contact from profile if missing or empty
                                            contacto: adiso.contacto || profile.contact_whatsapp || profile.contact_phone || '999999999',
                                            // Inject location if missing
                                            ubicacion: adiso.ubicacion || profile.contact_address || 'Perú',
                                            // Ensure we set user_id for backend
                                            user_id: user?.id,
                                            usuario_id: user?.id // Keep for compatibility if needed elsewhere
                                        };

                                        await saveAdiso(adisoToSave);
                                        setUserAdisos(prev => [adisoToSave, ...prev]);
                                        setShowPublishModal(false);
                                        handleEditPart('catalog');
                                        showToast('¡Producto añadido con éxito!', 'success');

                                        // Open the product immediately in a new tab
                                        const productUrl = `/adiso/${(adisoToSave as any).slug || adisoToSave.id}`;
                                        window.open(productUrl, '_blank');
                                    } catch (err) {
                                        console.error('Save error:', err);
                                        showToast('Error al guardar el producto. Inténtalo de nuevo.', 'error');
                                    }
                                }}
                                onCancel={() => setShowPublishModal(false)}
                                businessAddress={profile.contact_address || undefined}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function BusinessBuilderPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-secondary)]">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-[var(--accent-color)] opacity-20"></div>
                    <div className="text-[var(--text-secondary)] font-medium">Cargando editor...</div>
                </div>
            </div>
        }>
            <BusinessBuilderPageContent />
        </Suspense>
    );
}
