'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { createBusinessProfile, getBusinessProfile, updateBusinessProfile, checkSlugAvailability } from '@/lib/business';
import { BusinessProfile } from '@/types/business';
import { cn } from '@/lib/utils';
import { IconStore, IconCheck, IconClose } from '@/components/Icons';
import AuthModal from '@/components/AuthModal';

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

    const handleSlugCheck = async (slug: string) => {
        const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '');
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
        <div className="min-h-screen bg-[var(--bg-secondary)] pb-24 font-sans text-[var(--text-primary)]">

            {/* Header */}
            <div className="sticky top-0 z-20 backdrop-blur-xl bg-[var(--bg-primary)]/80 border-b border-[var(--border-subtle)]">
                <div className="max-w-6xl mx-auto px-4 h-16 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white shadow-lg">
                            <IconStore size={20} />
                        </div>
                        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[var(--text-primary)] to-purple-600">
                            Mi Negocio
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        {profile.is_published && profile.slug && (
                            <a
                                href={`/negocio/${profile.slug}`}
                                target="_blank"
                                className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                            >
                                <span>Ver Página</span>
                                <span className="text-xs opacity-50">↗</span>
                            </a>
                        )}
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="relative overflow-hidden px-6 py-2.5 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
                        >
                            {saving ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Guardando...
                                </span>
                            ) : 'Guardar Cambios'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Left: Configuration Steps */}
                <div className="lg:col-span-8 space-y-8">

                    {/* 1. Identity */}
                    <section className="bg-[var(--bg-primary)] rounded-2xl p-6 shadow-sm border border-[var(--border-subtle)] relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">1</span>
                            Identidad del Negocio
                        </h2>

                        <div className="grid gap-6">
                            <div>
                                <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">Nombre Comercial</label>
                                <input
                                    type="text"
                                    value={profile.name}
                                    onChange={e => setProfile({ ...profile, name: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none font-medium"
                                    placeholder="Ej. Restaurante El Cusqueñito"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">URL Personalizada</label>
                                <div className="flex rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                                    <span className="px-4 py-3 text-[var(--text-tertiary)] bg-[var(--bg-tertiary)]/50 border-r border-[var(--border-color)] select-none">
                                        adis.lat/negocio/
                                    </span>
                                    <input
                                        type="text"
                                        value={profile.slug}
                                        onChange={e => handleSlugCheck(e.target.value)}
                                        className="flex-1 px-4 py-3 bg-transparent outline-none font-medium"
                                        placeholder="mi-negocio"
                                    />
                                    {slugAvailable !== null && (
                                        <div className="px-4 flex items-center">
                                            {slugAvailable ? (
                                                <span className="text-green-500 flex items-center gap-1 text-sm font-bold">
                                                    <IconCheck size={14} /> Disponible
                                                </span>
                                            ) : (
                                                <span className="text-red-500 flex items-center gap-1 text-sm font-bold">
                                                    <IconClose size={14} /> No disponible
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <p className="mt-2 text-xs text-[var(--text-tertiary)]">Esta será la dirección web que compartirás con tus clientes.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">Descripción</label>
                                <textarea
                                    value={profile.description}
                                    onChange={e => setProfile({ ...profile, description: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none min-h-[120px] resize-y"
                                    placeholder="Cuéntanos qué hace especial a tu negocio..."
                                />
                            </div>
                        </div>
                    </section>

                    {/* 2. Visuals */}
                    <section className="bg-[var(--bg-primary)] rounded-2xl p-6 shadow-sm border border-[var(--border-subtle)] relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-purple-500" />
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-sm font-bold">2</span>
                            Imagen & Marca
                        </h2>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">Logo (URL)</label>
                                <input
                                    type="text"
                                    value={profile.logo_url || ''}
                                    onChange={e => setProfile({ ...profile, logo_url: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none text-sm"
                                    placeholder="https://..."
                                />
                                {profile.logo_url && (
                                    <div className="mt-3 w-16 h-16 rounded-xl border border-[var(--border-color)] overflow-hidden">
                                        <img src={profile.logo_url} alt="Logo preview" className="w-full h-full object-cover" />
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">Banner (URL)</label>
                                <input
                                    type="text"
                                    value={profile.banner_url || ''}
                                    onChange={e => setProfile({ ...profile, banner_url: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none text-sm"
                                    placeholder="https://..."
                                />
                                {profile.banner_url && (
                                    <div className="mt-3 w-full h-16 rounded-xl border border-[var(--border-color)] overflow-hidden">
                                        <img src={profile.banner_url} alt="Banner preview" className="w-full h-full object-cover" />
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">Color de Marca</label>
                                <div className="flex gap-3">
                                    <input
                                        type="color"
                                        value={profile.theme_color || '#3c6997'}
                                        onChange={e => setProfile({ ...profile, theme_color: e.target.value })}
                                        className="w-12 h-12 rounded-xl cursor-pointer border-0 p-1 bg-[var(--bg-secondary)]"
                                    />
                                    <div className="flex flex-col justify-center">
                                        <span className="font-mono text-sm">{profile.theme_color}</span>
                                        <span className="text-xs text-[var(--text-tertiary)]">Color principal</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 3. Contact */}
                    <section className="bg-[var(--bg-primary)] rounded-2xl p-6 shadow-sm border border-[var(--border-subtle)] relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-green-500" />
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm font-bold">3</span>
                            Contacto
                        </h2>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">WhatsApp</label>
                                <input
                                    type="text"
                                    value={profile.contact_whatsapp || ''}
                                    onChange={e => setProfile({ ...profile, contact_whatsapp: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all outline-none"
                                    placeholder="51987654321"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">Email Público</label>
                                <input
                                    type="email"
                                    value={profile.contact_email || ''}
                                    onChange={e => setProfile({ ...profile, contact_email: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all outline-none"
                                    placeholder="contacto@empresa.com"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">Dirección Física</label>
                                <input
                                    type="text"
                                    value={profile.contact_address || ''}
                                    onChange={e => setProfile({ ...profile, contact_address: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all outline-none"
                                    placeholder="Av. Cultura 123, Cusco"
                                />
                            </div>
                        </div>
                    </section>

                </div>

                {/* Right: Preview & Settings */}
                <div className="lg:col-span-4 space-y-6">

                    {/* Publishing Card */}
                    <div className="bg-[var(--bg-primary)] p-6 rounded-2xl shadow-lg border border-[var(--border-subtle)] sticky top-24">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-lg">Estado de la Tienda</h3>
                            <div className={cn("px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider", profile.is_published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500")}>
                                {profile.is_published ? 'ONLINE' : 'OFFLINE'}
                            </div>
                        </div>

                        <div className="mb-6">
                            <div
                                onClick={handleTogglePublish}
                                className="flex items-center gap-4 cursor-pointer group p-3 rounded-xl hover:bg-[var(--bg-secondary)] transition-colors border border-transparent hover:border-[var(--border-color)] select-none"
                            >
                                <div className={cn("w-14 h-8 rounded-full transition-all relative flex-shrink-0", profile.is_published ? "bg-green-500" : "bg-gray-300")}>
                                    <div
                                        className={cn("absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-sm transition-all transform", profile.is_published ? "translate-x-6" : "translate-x-0")}
                                    />
                                </div>
                                <div className="flex-1">
                                    <div className="font-bold text-sm">Publicar Tienda</div>
                                    <div className="text-xs text-[var(--text-secondary)]">
                                        {profile.is_published ? "Visible para todos" : "Solo tú puedes verla"}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {profile.slug && (
                            <div className="bg-[var(--bg-secondary)] p-4 rounded-xl border border-[var(--border-color)]">
                                <div className="text-xs font-bold text-[var(--text-tertiary)] mb-1 uppercase tracking-wider">Tu Link Público</div>
                                <a
                                    href={`/negocio/${profile.slug}`}
                                    target="_blank"
                                    className="text-blue-600 font-bold hover:underline break-all flex items-center gap-1"
                                >
                                    adis.lat/negocio/{profile.slug}
                                    <IconStore size={12} />
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Pro Tip Card */}
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-2xl text-white shadow-lg relative overflow-hidden">
                        <div className="absolute top-[-20px] right-[-20px] bg-white/10 w-32 h-32 rounded-full blur-2xl" />
                        <h3 className="font-bold text-lg mb-2 relative z-10">💡 Tip de Negocio</h3>
                        <p className="text-sm text-indigo-100 relative z-10 leading-relaxed">
                            Al crear tu página, todos los <b>Adisos</b> que publiques aparecerán automáticamente en tu catálogo. ¡Mantén tus anuncios actualizados para vender más!
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}
