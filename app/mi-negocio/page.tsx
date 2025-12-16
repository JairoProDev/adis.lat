'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { createBusinessProfile, getBusinessProfile, updateBusinessProfile, checkSlugAvailability } from '@/lib/business';
import { BusinessProfile } from '@/types/business';
import { cn } from '@/lib/utils';
import {
    IconCopy, IconEye, IconEdit, IconExternalLink,
    IconWhatsapp, IconMapMarkerAlt, IconEnvelope,
    IconStore, IconCheck, IconClose, IconRobot,
    IconInstagram, IconFacebook, IconTiktok
} from '@/components/Icons';
import AuthModal from '@/components/AuthModal';
import BusinessPublicView from '@/components/business/BusinessPublicView';
import { supabase, dbToAdiso } from '@/lib/supabase';
import { Adiso } from '@/types';
import { useDebounce } from '@/hooks/useDebounce';
import { useToast } from '@/hooks/useToast';

export default function BusinessBuilderPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
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

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        try {
            let result;
            if (profile.id) {
                result = await updateBusinessProfile(user.id, profile);
            } else {
                result = await createBusinessProfile({ ...profile, user_id: user.id });
            }

            if (result) {
                setProfile(result);
                // Show toast or nice alert
                // alert('¡Tu negocio ha sido actualizado correctamente!'); 
                // Removed alert for smoother experience if used often, or keep it? 
                // Let's keep a subtle indicator or just the button state is enough usually, but alert is safe for now.
                // However user complained about UX. Let's use a nice browser notification or just rely on the button stopping "Loading".
            }
        } catch (e) {
            console.error(e);
            alert('Error al guardar. Por favor intenta de nuevo.');
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
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
    const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor'); // For mobile

    // Auto-save: Debounce profile changes
    const debouncedProfile = useDebounce(profile, 1500);
    const [lastSavedProfile, setLastSavedProfile] = useState<string>('');

    // Fetch user ads for preview
    useEffect(() => {
        if (!user || !supabase) return;

        async function fetchUserAds() {
            const { data } = await supabase!
                .from('adisos')
                .select('*')
                .eq('user_id', user!.id)
                .order('fecha_publicacion', { ascending: false })
                .limit(6);

            if (data) {
                // Convert DB adisos to Frontend Adisos
                const formattedAds = data.map(dbToAdiso);
                setUserAdisos(formattedAds);
            }
        }
        fetchUserAds();
    }, [user]);

    // Auto-save Logic
    useEffect(() => {
        if (!user || profileLoading || !profile.id) return;

        // Check if there are actual changes to save
        const currentProfileStr = JSON.stringify(profile);
        if (currentProfileStr === lastSavedProfile) return;

        const autoSave = async () => {
            setSaving(true);
            try {
                // Determine if we create or update
                // Note: We usually update here since profile.id should exist after initial load
                // If it's a new profile, we might wait for explicit save or handle it carefully
                if (profile.id) {
                    await updateBusinessProfile(user.id, profile);
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

    // Use dummy ads if user has none, to show catalog potential
    const previewAdisos = userAdisos.length > 0 ? userAdisos : DUMMY_ADISOS;

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
                        {/* Mobile Toggle */}
                        <div className="flex md:hidden bg-slate-100 p-1 rounded-lg border border-slate-200 mr-2">
                            <button
                                onClick={() => setActiveTab('editor')}
                                className={cn("p-2 rounded-md transition-all", activeTab === 'editor' ? "bg-white shadow text-blue-600" : "text-slate-500")}
                            >
                                <IconEdit size={18} />
                            </button>
                            <button
                                onClick={() => setActiveTab('preview')}
                                className={cn("p-2 rounded-md transition-all", activeTab === 'preview' ? "bg-white shadow text-blue-600" : "text-slate-500")}
                            >
                                <IconEye size={18} />
                            </button>
                        </div>

                        {profile.slug && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleDownloadQR}
                                    className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                                    title="Descargar QR para imprimir"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><rect x="7" y="7" width="3" height="3" /><rect x="14" y="7" width="3" height="3" /><rect x="7" y="14" width="3" height="3" /><rect x="14" y="14" width="3" height="3" /></svg>
                                    <span className="hidden lg:inline">QR</span>
                                </button>
                                <button
                                    onClick={handleCopyLink}
                                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <IconCopy size={18} />
                                    <span className="hidden lg:inline">Copiar Link</span>
                                </button>
                            </div>
                        )}

                        <div className="h-6 w-px bg-slate-300 mx-1 hidden sm:block"></div>

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
                <div className={cn(
                    "bg-white border-r border-slate-200 h-full overflow-y-auto custom-scrollbar transition-transform duration-300 z-20",
                    // Mobile: Absolute positioning, toggles via translate
                    "absolute inset-0 w-full",
                    activeTab === 'editor' ? "translate-x-0" : "-translate-x-full",
                    // Desktop: Relative positioning, fixed width, always visible
                    "md:relative md:w-[450px] lg:w-[500px] md:translate-x-0 md:inset-auto md:flex-shrink-0"
                )}>
                    <div className="p-6 space-y-8 pb-32">

                        {/* Section: Basic Info */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Identidad</h3>
                            </div>

                            <div className="space-y-3">
                                <label className="block">
                                    <span className="text-sm font-semibold text-slate-700 mb-1 block">Nombre del Negocio</span>
                                    <input
                                        type="text"
                                        value={profile.name}
                                        onChange={e => handleNameChange(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none font-medium"
                                        placeholder="Ej. Mi Tienda Genial"
                                    />
                                </label>

                                <label className="block">
                                    <span className="text-sm font-semibold text-slate-700 mb-1 block">URL (Slug)</span>
                                    <div className="flex items-center rounded-lg bg-slate-50 border border-slate-200 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                                        <span className="pl-3 text-slate-400 text-sm select-none">/negocio/</span>
                                        <input
                                            type="text"
                                            value={profile.slug}
                                            onChange={e => {
                                                setSlugManuallyEdited(true);
                                                handleSlugCheck(e.target.value);
                                            }}
                                            className="flex-1 px-2 py-2.5 bg-transparent outline-none text-sm font-medium text-slate-700"
                                            placeholder="mi-tienda"
                                        />
                                        {profile.slug && (
                                            <div className="pr-3">
                                                {slugAvailable === true && <IconCheck size={16} className="text-green-500" />}
                                                {slugAvailable === false && <IconClose size={16} className="text-red-500" />}
                                            </div>
                                        )}
                                    </div>
                                </label>

                                <label className="block">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm font-semibold text-slate-700">Descripción</span>
                                        <button
                                            onClick={() => {
                                                if (!profile.name || profile.name.length < 3) {
                                                    showToast('Primero escribe el nombre del negocio', 'error');
                                                    return;
                                                }
                                                // Simulación de IA
                                                setSaving(true);
                                                setTimeout(() => {
                                                    setProfile({
                                                        ...profile,
                                                        description: `¡Bienvenidos a ${profile.name}! Somos líderes en nuestra industria, comprometidos con la calidad y la satisfacción del cliente. Ofrecemos los mejores productos y servicios personalizados para ti. ¡Visítanos y descubre la diferencia!`
                                                    });
                                                    setSaving(false);
                                                    showToast('¡Descripción mejorada con IA!', 'success');
                                                }, 1500);
                                            }}
                                            className="text-xs flex items-center gap-1 text-purple-600 font-medium hover:bg-purple-50 px-2 py-1 rounded-full transition-colors"
                                        >
                                            <IconRobot size={12} />
                                            Mejorar con IA
                                        </button>
                                    </div>
                                    <textarea
                                        value={profile.description}
                                        onChange={e => setProfile({ ...profile, description: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none text-sm min-h-[100px] resize-y"
                                        placeholder="Describe tu negocio en pocas palabras..."
                                    />
                                </label>
                            </div>
                        </div>

                        <div className="h-px bg-slate-100" />

                        {/* Section: Branding */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Marca</h3>

                            <div className="grid grid-cols-2 gap-3">
                                <label className="block">
                                    <span className="text-xs font-semibold text-slate-600 mb-1 block">Logo URL</span>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={profile.logo_url || ''}
                                            onChange={e => setProfile({ ...profile, logo_url: e.target.value })}
                                            className="w-full pl-8 pr-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:border-blue-500 outline-none text-xs"
                                            placeholder="https://..."
                                        />
                                        <div className="absolute left-2.5 top-2.5 w-3 h-3 rounded-full overflow-hidden bg-slate-200">
                                            {profile.logo_url && <img src={profile.logo_url} className="w-full h-full object-cover" />}
                                        </div>
                                    </div>
                                </label>
                                <label className="block">
                                    <span className="text-xs font-semibold text-slate-600 mb-1 block">Banner URL</span>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={profile.banner_url || ''}
                                            onChange={e => setProfile({ ...profile, banner_url: e.target.value })}
                                            className="w-full pl-8 pr-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:border-blue-500 outline-none text-xs"
                                            placeholder="https://..."
                                        />
                                        <div className="absolute left-2.5 top-2.5 w-4 h-2 rounded-sm overflow-hidden bg-slate-200">
                                            {profile.banner_url && <img src={profile.banner_url} className="w-full h-full object-cover" />}
                                        </div>
                                    </div>
                                </label>
                            </div>

                            <label className="block mb-3">
                                <span className="text-xs font-semibold text-slate-600 mb-1 block">Estilo de Diseño</span>
                                <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-200">
                                    {['standard', 'bento', 'minimal'].map(style => (
                                        <button
                                            key={style}
                                            onClick={() => setProfile({ ...profile, layout_style: style as any })}
                                            className={cn(
                                                "flex-1 py-1.5 text-xs font-medium rounded-md transition-all capitalize",
                                                (profile.layout_style || 'standard') === style ? "bg-white shadow text-blue-600" : "text-slate-500 hover:text-slate-700"
                                            )}
                                        >
                                            {style === 'standard' ? 'Estándar' : style === 'bento' ? 'Grid (Bento)' : 'Minimal'}
                                        </button>
                                    ))}
                                </div>
                            </label>

                            <label className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                                <div>
                                    <span className="text-sm font-semibold text-slate-700 block">Color de Marca</span>
                                    <span className="text-xs text-slate-400">Define el estilo de tu página</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex gap-1 mr-2">
                                        {['#3c6997', '#0f172a', '#16a34a', '#dc2626', '#e11d48', '#7c3aed'].map(c => (
                                            <button
                                                key={c}
                                                onClick={() => setProfile({ ...profile, theme_color: c })}
                                                className={cn("w-5 h-5 rounded-full border border-slate-200", profile.theme_color === c ? "ring-2 ring-offset-1 ring-slate-400" : "")}
                                                style={{ backgroundColor: c }}
                                            />
                                        ))}
                                    </div>
                                    <div className="h-6 w-px bg-slate-300 mx-1"></div>
                                    <input
                                        type="color"
                                        value={profile.theme_color || '#3c6997'}
                                        onChange={e => setProfile({ ...profile, theme_color: e.target.value })}
                                        className="w-8 h-8 rounded-full border-0 p-0 cursor-pointer overflow-hidden shadow-sm"
                                    />
                                </div>
                            </label>

                            <div className="grid grid-cols-2 gap-3">
                                <label className="block">
                                    <span className="text-xs font-semibold text-slate-600 mb-1 block">Favicon URL</span>
                                    <input
                                        type="text"
                                        value={profile.favicon_url || ''}
                                        onChange={e => setProfile({ ...profile, favicon_url: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:border-blue-500 outline-none text-xs"
                                        placeholder="https://..."
                                    />
                                </label>
                                <label className="block">
                                    <span className="text-xs font-semibold text-slate-600 mb-1 block">Fuente (Tipografía)</span>
                                    <select
                                        value={profile.font_family || 'sans'}
                                        onChange={e => setProfile({ ...profile, font_family: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:border-blue-500 outline-none text-xs"
                                    >
                                        <option value="sans">Moderna (Sans)</option>
                                        <option value="serif">Elegante (Serif)</option>
                                        <option value="mono">Técnica (Mono)</option>
                                    </select>
                                </label>
                            </div>
                        </div>

                        <div className="h-px bg-slate-100" />

                        {/* Section: Contact */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Contacto</h3>

                            <div className="space-y-3">
                                <label className="flex items-center gap-3">
                                    <IconWhatsapp className="text-green-600 flex-shrink-0" size={20} />
                                    <input
                                        type="text"
                                        value={profile.contact_whatsapp || ''}
                                        onChange={e => setProfile({ ...profile, contact_whatsapp: e.target.value })}
                                        className="flex-1 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:border-green-500 outline-none text-sm"
                                        placeholder="WhatsApp (Ej. 51999...)"
                                    />
                                </label>
                                <label className="flex items-center gap-3">
                                    <IconMapMarkerAlt className="text-red-500 flex-shrink-0" size={20} />
                                    <input
                                        type="text"
                                        value={profile.contact_address || ''}
                                        onChange={e => setProfile({ ...profile, contact_address: e.target.value })}
                                        className="flex-1 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:border-red-500 outline-none text-sm"
                                        placeholder="Dirección Física"
                                    />
                                </label>
                                <label className="flex items-center gap-3">
                                    <IconEnvelope className="text-blue-500 flex-shrink-0" size={20} />
                                    <input
                                        type="email"
                                        value={profile.contact_email || ''}
                                        onChange={e => setProfile({ ...profile, contact_email: e.target.value })}
                                        className="flex-1 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:border-blue-500 outline-none text-sm"
                                        placeholder="Email Público"
                                    />
                                </label>
                            </div>
                        </div>

                        <div className="h-px bg-slate-100" />

                        {/* Section: Social Media */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Redes Sociales</h3>
                            <div className="space-y-3">
                                {[
                                    { network: 'instagram', color: 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500', placeholder: 'instagram.com/tu_negocio' },
                                    { network: 'facebook', color: 'bg-blue-600', placeholder: 'facebook.com/tu_negocio' },
                                    { network: 'tiktok', color: 'bg-black', placeholder: 'tiktok.com/@tu_negocio' }
                                ].map((social) => {
                                    const link = (profile.social_links || []).find(l => l.network === social.network);
                                    return (
                                        <label key={social.network} className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full ${social.color} flex items-center justify-center text-white shrink-0 shadow-sm`}>
                                                {social.network === 'instagram' && <IconInstagram size={16} />}
                                                {social.network === 'facebook' && <IconFacebook size={16} />}
                                                {social.network === 'tiktok' && <IconTiktok size={14} />}
                                            </div>
                                            <input
                                                type="text"
                                                value={link?.url || ''}
                                                onChange={(e) => {
                                                    const url = e.target.value;
                                                    const currentLinks = profile.social_links || [];
                                                    const otherLinks = currentLinks.filter(l => l.network !== social.network);
                                                    if (url) {
                                                        setProfile({ ...profile, social_links: [...otherLinks, { network: social.network as any, url }] });
                                                    } else {
                                                        setProfile({ ...profile, social_links: otherLinks });
                                                    }
                                                }}
                                                className="flex-1 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:border-blue-500 outline-none text-sm transition-all focus:bg-white"
                                                placeholder={social.placeholder}
                                            />
                                        </label>
                                    );
                                })}
                            </div>
                        </div>


                        <div className="h-px bg-slate-100" />

                        {/* Section: Business Hours */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Horarios de Atención</h3>
                            <div className="space-y-2 bg-slate-50/50 p-4 rounded-xl border border-slate-200">
                                {['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'].map((day) => {
                                    const hours = (profile.business_hours as any)?.[day] || { open: '09:00', close: '18:00', closed: false };
                                    return (
                                        <div key={day} className="flex items-center justify-between text-sm py-1">
                                            <span className="capitalize w-24 text-slate-700 font-medium">{day}</span>
                                            <div className="flex items-center gap-2">
                                                <label className="cursor-pointer flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={!hours.closed}
                                                        onChange={(e) => {
                                                            const newHours = { ...profile.business_hours, [day]: { ...hours, closed: !e.target.checked } };
                                                            setProfile({ ...profile, business_hours: newHours });
                                                        }}
                                                        className="text-blue-600 rounded focus:ring-blue-500 mr-2"
                                                    />
                                                    <span className="sr-only">Abierto</span>
                                                </label>
                                                {!hours.closed ? (
                                                    <>
                                                        <input
                                                            type="time"
                                                            value={hours.open}
                                                            onChange={(e) => {
                                                                const newHours = { ...profile.business_hours, [day]: { ...hours, open: e.target.value } };
                                                                setProfile({ ...profile, business_hours: newHours });
                                                            }}
                                                            className="bg-white border border-slate-200 rounded px-2 py-1 text-xs outline-none focus:border-blue-500 w-20 text-center"
                                                        />
                                                        <span className="text-slate-400">-</span>
                                                        <input
                                                            type="time"
                                                            value={hours.close}
                                                            onChange={(e) => {
                                                                const newHours = { ...profile.business_hours, [day]: { ...hours, close: e.target.value } };
                                                                setProfile({ ...profile, business_hours: newHours });
                                                            }}
                                                            className="bg-white border border-slate-200 rounded px-2 py-1 text-xs outline-none focus:border-blue-500 w-20 text-center"
                                                        />
                                                    </>
                                                ) : (
                                                    <span className="text-slate-400 text-xs italic px-10">Cerrado</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="h-px bg-slate-100" />

                        {/* Section: Additional Settings */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Marketing & Configuración</h3>

                            <label className="block p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                                <span className="text-sm font-semibold text-slate-700 mb-2 block flex items-center gap-2">
                                    📣 Barra de Anuncios (Sticky Bar)
                                    <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase font-bold">Nuevo</span>
                                </span>
                                <input
                                    type="text"
                                    value={profile.announcement_text || ''}
                                    onChange={e => setProfile({ ...profile, announcement_text: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-lg bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm mb-2"
                                    placeholder="Ej. ¡Envío gratis por compras mayores a S/100!"
                                />
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={profile.announcement_active !== false} // Default active if text exists
                                        onChange={e => setProfile({ ...profile, announcement_active: e.target.checked })}
                                        className="rounded text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-xs text-slate-600">Mostrar barra en la parte superior</span>
                                </div>
                            </label>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <label className="block">
                                    <span className="text-xs font-semibold text-slate-600 mb-1 block">Pixel de Facebook</span>
                                    <input
                                        type="text"
                                        value={profile.pixel_facebook || ''}
                                        onChange={e => setProfile({ ...profile, pixel_facebook: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:border-blue-500 outline-none text-xs"
                                        placeholder="ID (Ej. 123456...)"
                                    />
                                </label>
                                <label className="block">
                                    <span className="text-xs font-semibold text-slate-600 mb-1 block">Tiktok Pixel</span>
                                    <input
                                        type="text"
                                        value={profile.pixel_tiktok || ''}
                                        onChange={e => setProfile({ ...profile, pixel_tiktok: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:border-blue-500 outline-none text-xs"
                                        placeholder="ID (Ej. C123...)"
                                    />
                                </label>
                            </div>

                            <label className="block">
                                <span className="text-xs font-semibold text-slate-600 mb-1 block">Dominio Personalizado</span>
                                <div className="flex items-center rounded-lg bg-slate-50 border border-slate-200">
                                    <span className="pl-3 text-slate-400 text-xs">https://</span>
                                    <input
                                        type="text"
                                        value={profile.custom_domain || ''}
                                        onChange={e => setProfile({ ...profile, custom_domain: e.target.value })}
                                        className="flex-1 px-2 py-2 bg-transparent outline-none text-xs"
                                        placeholder="midominio.com"
                                    />
                                    <div className="pr-2">
                                        <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded uppercase font-bold tracking-wide border border-amber-200">Pro</span>
                                    </div>
                                </div>
                            </label>

                            <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-white hover:border-slate-300 transition-colors cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={profile.is_vacation_mode || false}
                                    onChange={e => setProfile({ ...profile, is_vacation_mode: e.target.checked })}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <div>
                                    <span className="text-sm text-slate-700 font-medium block">Activar Modo Vacaciones</span>
                                    <span className="text-xs text-slate-500">Oculta botones de compra y muestra aviso</span>
                                </div>
                            </label>

                            <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-white hover:border-slate-300 transition-colors cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={profile.show_contact_form !== false}
                                    onChange={e => setProfile({ ...profile, show_contact_form: e.target.checked })}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <div>
                                    <span className="text-sm text-slate-700 font-medium block">Mostrar Formulario de Contacto</span>
                                    <span className="text-xs text-slate-500">Permite que tus clientes te envíen mensajes directamente</span>
                                </div>
                            </label>
                        </div>

                        {/* Extra Guidance Card */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100 text-sm text-blue-800">
                            <p className="font-medium mb-1">💡 ¿Listo para vender?</p>
                            <p className="text-blue-600/80 text-xs">Asegúrate de tener adisos publicados. Aparecerán automáticamente en la pestaña "Catálogo".</p>
                            <button
                                onClick={() => router.push('/?action=publicar')}
                                className="mt-2 text-xs font-bold underline hover:text-blue-900"
                            >
                                Publicar nuevo adiso
                            </button>
                        </div>
                    </div>
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
                            <div className="sticky top-0 z-50 bg-slate-800 text-slate-400 p-2 flex items-center gap-2 text-xs border-b border-slate-700 hidden md:flex">
                                <div className="flex gap-1.5 ml-1">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                                </div>
                                <div className="flex-1 text-center font-mono opacity-50 text-[10px] truncate px-4">
                                    adis.lat/negocio/{profile.slug || '...'}
                                </div>
                            </div>

                            {/* The Real Preview Component */}
                            <div className="relative min-h-full bg-white isolate">
                                <BusinessPublicView
                                    profile={previewProfile}
                                    adisos={previewAdisos}
                                    isPreview={true}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
