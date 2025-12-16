'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { createBusinessProfile, getBusinessProfile, updateBusinessProfile, checkSlugAvailability } from '@/lib/business';
import { BusinessProfile } from '@/types/business';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { IconCheck, IconClose } from '@/components/Icons'; // Assuming these exist or I'll use text

export default function BusinessBuilderPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState<Partial<BusinessProfile>>({
        name: '',
        slug: '',
        description: '',
        contact_whatsapp: '',
        contact_email: '',
        contact_phone: '',
        contact_address: '',
        theme_color: '#000000',
        social_links: [],
        custom_blocks: [],
        business_hours: {},
        is_published: false
    });
    const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);

    useEffect(() => {
        async function loadProfile() {
            if (!user) return;
            try {
                const existing = await getBusinessProfile(user.id);
                if (existing) {
                    setProfile(existing);
                } else {
                    // Pre-fill from user profile?
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        loadProfile();
    }, [user]);

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        try {
            if (profile.id) {
                await updateBusinessProfile(user.id, profile);
            } else {
                await createBusinessProfile({ ...profile, user_id: user.id });
            }
            alert('¡Perfil de negocio guardado!');
        } catch (e) {
            console.error(e);
            alert('Error al guardar el perfil.');
        } finally {
            setSaving(false);
        }
    };

    const handleSlugCheck = async (slug: string) => {
        // Basic regex check
        const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '');
        setProfile(p => ({ ...p, slug: cleanSlug }));
        if (cleanSlug.length < 3) {
            setSlugAvailable(false);
            return;
        }
        if (profile.id && cleanSlug === profile.slug) {
            setSlugAvailable(true); // Same slug as current
            return;
        }
        const isAvailable = await checkSlugAvailability(cleanSlug);
        setSlugAvailable(isAvailable);
    };

    if (loading) return <div className="p-8 text-center">Cargando tu negocio...</div>;

    return (
        <div className="min-h-screen bg-[var(--bg-secondary)] pb-20">
            <div className="bg-[var(--bg-primary)] border-b border-[var(--border-color)] p-4 sticky top-0 z-10 shadow-sm">
                <div className="max-w-5xl mx-auto flex justify-between items-center">
                    <h1 className="text-xl font-bold text-[var(--text-primary)]">Mi Negocio Digital</h1>
                    <div className="flex gap-3">
                        {profile.slug && (
                            <a
                                href={`/negocio/${profile.slug}`}
                                target="_blank"
                                className="px-4 py-2 text-sm font-medium text-[var(--text-primary)] border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-secondary)]"
                            >
                                Ver Mi Página
                            </a>
                        )}
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-6 py-2 text-sm font-bold text-white bg-black rounded-lg hover:opacity-90 disabled:opacity-50"
                            style={{ backgroundColor: 'var(--text-primary)', color: 'var(--bg-primary)' }}
                        >
                            {saving ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto p-4 grid grid-cols-1 md:grid-cols-3 gap-8 mt-6">

                {/* Left Column: Editor */}
                <div className="md:col-span-2 space-y-6">

                    {/* Section: Basic Info */}
                    <section className="bg-[var(--bg-primary)] p-6 rounded-xl border border-[var(--border-color)] shadow-sm">
                        <h2 className="text-lg font-semibold mb-4 text-[var(--text-primary)]">Información Básica</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-[var(--text-secondary)] mb-1">Nombre del Negocio</label>
                                <input
                                    type="text"
                                    value={profile.name}
                                    onChange={e => setProfile({ ...profile, name: e.target.value })}
                                    className="w-full p-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                                    placeholder="Ej. Tienda de Jairo"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-[var(--text-secondary)] mb-1">URL Personalizada (Slug)</label>
                                <div className="flex items-center gap-2">
                                    <span className="text-[var(--text-secondary)]">adis.lat/negocio/</span>
                                    <input
                                        type="text"
                                        value={profile.slug}
                                        onChange={e => handleSlugCheck(e.target.value)}
                                        className={cn(
                                            "flex-1 p-2 rounded-lg border bg-[var(--bg-secondary)] text-[var(--text-primary)]",
                                            slugAvailable === true ? "border-green-500" : slugAvailable === false ? "border-red-500" : "border-[var(--border-color)]"
                                        )}
                                        placeholder="mi-tienda"
                                    />
                                </div>
                                {slugAvailable === false && <p className="text-xs text-red-500 mt-1">Esta URL no está disponible</p>}
                            </div>

                            <div>
                                <label className="block text-sm text-[var(--text-secondary)] mb-1">Descripción</label>
                                <textarea
                                    value={profile.description}
                                    onChange={e => setProfile({ ...profile, description: e.target.value })}
                                    className="w-full p-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] h-24"
                                    placeholder="Describe tu negocio..."
                                />
                            </div>
                        </div>
                    </section>

                    {/* Section: Contact */}
                    <section className="bg-[var(--bg-primary)] p-6 rounded-xl border border-[var(--border-color)] shadow-sm">
                        <h2 className="text-lg font-semibold mb-4 text-[var(--text-primary)]">Contacto</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-[var(--text-secondary)] mb-1">WhatsApp</label>
                                <input
                                    type="text"
                                    value={profile.contact_whatsapp || ''}
                                    onChange={e => setProfile({ ...profile, contact_whatsapp: e.target.value })}
                                    className="w-full p-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                                    placeholder="51999..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-[var(--text-secondary)] mb-1">Email</label>
                                <input
                                    type="email"
                                    value={profile.contact_email || ''}
                                    onChange={e => setProfile({ ...profile, contact_email: e.target.value })}
                                    className="w-full p-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                                    placeholder="contacto@empresa.com"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm text-[var(--text-secondary)] mb-1">Dirección Física</label>
                                <input
                                    type="text"
                                    value={profile.contact_address || ''}
                                    onChange={e => setProfile({ ...profile, contact_address: e.target.value })}
                                    className="w-full p-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                                    placeholder="Jr. Comercio 123, Cusco"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Section: Branding */}
                    <section className="bg-[var(--bg-primary)] p-6 rounded-xl border border-[var(--border-color)] shadow-sm">
                        <h2 className="text-lg font-semibold mb-4 text-[var(--text-primary)]">Marca & Diseño</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-[var(--text-secondary)] mb-1">Logo URL</label>
                                <input
                                    type="text"
                                    value={profile.logo_url || ''}
                                    onChange={e => setProfile({ ...profile, logo_url: e.target.value })}
                                    className="w-full p-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                                    placeholder="https://..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-[var(--text-secondary)] mb-1">Banner URL</label>
                                <input
                                    type="text"
                                    value={profile.banner_url || ''}
                                    onChange={e => setProfile({ ...profile, banner_url: e.target.value })}
                                    className="w-full p-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                                    placeholder="https://..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-[var(--text-secondary)] mb-1">Color del Tema</label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        value={profile.theme_color || '#000000'}
                                        onChange={e => setProfile({ ...profile, theme_color: e.target.value })}
                                        className="h-10 w-20 p-1 rounded border border-[var(--border-color)] bg-transparent"
                                    />
                                    <span className="text-sm self-center text-[var(--text-secondary)]">{profile.theme_color}</span>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Right Column: Preview / Settings */}
                <div className="space-y-6">
                    <section className="bg-[var(--bg-primary)] p-6 rounded-xl border border-[var(--border-color)] shadow-sm sticky top-24">
                        <h2 className="text-lg font-semibold mb-4 text-[var(--text-primary)]">Estado</h2>
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[var(--text-primary)]">Publicar Sitio</span>
                            <button
                                onClick={() => setProfile({ ...profile, is_published: !profile.is_published })}
                                className={cn(
                                    "w-12 h-6 rounded-full transition-colors relative",
                                    profile.is_published ? "bg-green-500" : "bg-gray-300"
                                )}
                            >
                                <span className={cn(
                                    "absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform",
                                    profile.is_published ? "translate-x-6" : "translate-x-0"
                                )} />
                            </button>
                        </div>
                        <p className="text-sm text-[var(--text-secondary)] mb-4">
                            {profile.is_published
                                ? "Tu sitio está visible para todo el mundo."
                                : "Tu sitio está oculto. Nadie puede verlo."
                            }
                        </p>
                        {profile.is_published && profile.slug && (
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-600 dark:text-blue-400 break-all">
                                <a href={`/negocio/${profile.slug}`} target="_blank" className="hover:underline">
                                    adis.lat/negocio/{profile.slug}
                                </a>
                            </div>
                        )}
                    </section>

                    <section className="bg-gradient-to-br from-purple-500 to-indigo-600 p-6 rounded-xl text-white shadow-lg">
                        <h3 className="font-bold text-lg mb-2">💡 Tip Pro</h3>
                        <p className="text-sm opacity-90">
                            Agrega links a tus "Adisos" en el catálogo para que aparezcan automáticamente en tu Store.
                        </p>
                    </section>
                </div>

            </div>
        </div>
    );
}
