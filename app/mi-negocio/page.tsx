/**
 * Página de Creación/Edición de Negocios - REDISEÑO COMPLETO
 * 
 * Experiencia guiada por chatbot con vista en tiempo real
 * Sin formularios separados, todo inline y fluido
 */

'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { createBusinessProfile, getBusinessProfile, updateBusinessProfile } from '@/lib/business';
import { BusinessProfile } from '@/types/business';
import { IconEye, IconEdit, IconX, IconCheck } from '@/components/Icons';
import AuthModal from '@/components/AuthModal';
import BusinessPublicView from '@/components/business/BusinessPublicView';
import ChatbotGuide from '@/components/business/ChatbotGuide';
import { useDebounce } from '@/hooks/useDebounce';
import { useToast } from '@/hooks/useToast';

function BusinessBuilderPageContent() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { success, error } = useToast();

    const [profileLoading, setProfileLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [chatbotMinimized, setChatbotMinimized] = useState(false);
    const [isFirstTime, setIsFirstTime] = useState(false);

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
        theme_color: '#53acc5', // Default: turquesa
        social_links: [],
        business_hours: {
            monday: { open: '', close: '', closed: false },
            tuesday: { open: '', close: '', closed: false },
            wednesday: { open: '', close: '', closed: false },
            thursday: { open: '', close: '', closed: false },
            friday: { open: '', close: '', closed: false },
            saturday: { open: '', close: '', closed: false },
            sunday: { open: '', close: '', closed: true }
        },
        announcement_text: '',
        is_published: false
    });

    const debouncedProfile = useDebounce(profile, 1000);

    // Load profile on mount
    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            setShowAuthModal(true);
            setProfileLoading(false);
            return;
        }

        loadProfile();
    }, [user, authLoading]);

    // Auto-save on debounced profile change
    useEffect(() => {
        if (!profile.id || profileLoading) return;
        handleSave(false);
    }, [debouncedProfile]);

    const loadProfile = async () => {
        if (!user) return;

        try {
            setProfileLoading(true);
            const existingProfile = await getBusinessProfile(user.id);

            if (existingProfile) {
                setProfile(existingProfile);
                setIsFirstTime(false);
                setChatbotMinimized(true); // Usuario existente: chatbot minimizado
            } else {
                // Primera vez: mostrar chatbot
                setIsFirstTime(true);
                setChatbotMinimized(false);
                setProfile(prev => ({ ...prev, user_id: user.id }));
            }
        } catch (err) {
            console.error('Error loading profile:', err);
            error('Error al cargar tu página');
        } finally {
            setProfileLoading(false);
        }
    };

    const handleSave = async (showNotification = true) => {
        if (!user || !profile.name) return;

        try {
            setSaving(true);

            let savedProfile;
            if (profile.id) {
                savedProfile = await updateBusinessProfile(user.id, profile);
            } else {
                savedProfile = await createBusinessProfile({
                    ...profile,
                    user_id: user.id,
                    slug: profile.slug || profile.name.toLowerCase().replace(/\s+/g, '-')
                } as BusinessProfile);
            }

            if (savedProfile) {
                setProfile(savedProfile);
                if (showNotification) {
                    success('¡Cambios guardados!');
                }
            }
        } catch (err: any) {
            console.error('Error saving profile:', err);
            if (showNotification) {
                error('Error al guardar: ' + err.message);
            }
        } finally {
            setSaving(false);
        }
    };

    const handleChatbotUpdate = (field: keyof BusinessProfile, value: any) => {
        setProfile(prev => ({ ...prev, [field]: value }));
    };

    const handleChatbotComplete = async () => {
        await handleSave(true);
        setChatbotMinimized(true);
        success('¡Tu página está lista! 🎉');
    };

    const handlePublish = async () => {
        if (!user || !profile.id) {
            error('Guarda los cambios primero');
            return;
        }

        try {
            setSaving(true);
            const updated = await updateBusinessProfile(user.id, {
                ...profile,
                is_published: !profile.is_published
            });

            if (updated) {
                setProfile(updated);
                success(updated.is_published ? '¡Página publicada! 🎉' : 'Página despublicada');
            }
        } catch (err: any) {
            error('Error al publicar: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    // Auth check
    if (authLoading || profileLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <div className="text-center">
                    <div className="w-16 h-16 border-4 rounded-full animate-spin mx-auto mb-4"
                        style={{
                            borderColor: 'var(--brand-blue)',
                            borderTopColor: 'transparent'
                        }}
                    />
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Cargando...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <>
                <AuthModal
                    abierto={showAuthModal}
                    onCerrar={() => router.push('/')}
                    modoInicial="login"
                />
                <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <div className="text-center">
                        <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                            Inicia sesión para continuar
                        </h2>
                    </div>
                </div>
            </>
        );
    }

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            {/* Top Bar */}
            <div className="sticky top-0 z-30 bg-white border-b shadow-sm h-16" style={{ borderColor: 'var(--border-color)' }}>
                <div className="max-w-7xl mx-auto px-4 h-full flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.push('/')}
                            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                        >
                            <IconX size={20} color="var(--text-secondary)" />
                        </button>
                        <div>
                            <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                                {profile.name || 'Tu Página de Negocio'}
                            </h1>
                            {saving && (
                                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                    Guardando...
                                </span>
                            )}
                            {!saving && profile.id && (
                                <span className="text-xs" style={{ color: 'var(--brand-blue)' }}>
                                    ✓ Guardado automáticamente
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {!isFirstTime && (
                            <button
                                onClick={() => setEditMode(!editMode)}
                                className="px-3 md:px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all whitespace-nowrap text-sm md:text-base"
                                style={{
                                    backgroundColor: editMode ? 'var(--brand-yellow)' : 'var(--bg-secondary)',
                                    color: editMode ? '#fff' : 'var(--text-primary)'
                                }}
                            >
                                {editMode ? <IconCheck size={16} /> : <IconEdit size={16} />}
                                <span className={editMode ? "hidden sm:inline" : ""}>
                                    {editMode ? 'Vista Normal' : 'Editar'}
                                </span>
                            </button>
                        )}

                        {profile.slug && (
                            <a
                                href={`/${profile.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:shadow-md transition-all"
                                style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                            >
                                <IconEye size={16} />
                                Ver Página
                            </a>
                        )}

                        <button
                            onClick={handlePublish}
                            disabled={saving || !profile.id}
                            className="px-6 py-2 rounded-lg font-bold text-white flex items-center gap-2 hover:shadow-lg transition-all disabled:opacity-50"
                            style={{ backgroundColor: 'var(--brand-blue)' }}
                        >
                            {profile.is_published ? 'Despublicar' : 'Publicar'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content - Vista en Tiempo Real */}
            <div className="flex-1 overflow-auto pb-[42vh]">
                <div className="max-w-4xl mx-auto py-8 px-4">
                    <BusinessPublicView
                        profile={profile}
                        isPreview
                        editMode={editMode}
                        onUpdate={handleChatbotUpdate}
                    />
                </div>
            </div>

            {/* Chatbot Guiado */}
            {(isFirstTime || !chatbotMinimized) && (
                <ChatbotGuide
                    profile={profile}
                    onUpdate={handleChatbotUpdate}
                    onComplete={handleChatbotComplete}
                    isMinimized={chatbotMinimized}
                    onToggleMinimize={() => setChatbotMinimized(!chatbotMinimized)}
                />
            )}

            {/* Botón para reabrir chatbot si está minimizado */}
            {!isFirstTime && chatbotMinimized && (
                <button
                    onClick={() => setChatbotMinimized(false)}
                    className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center z-50 hover:scale-110 transition-transform"
                    style={{ backgroundColor: 'var(--brand-blue)' }}
                >
                    <span className="text-2xl">💬</span>
                </button>
            )}
        </div>
    );
}

export default function BusinessBuilderPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-16 h-16 border-4 rounded-full animate-spin"
                    style={{ borderColor: 'var(--brand-blue)', borderTopColor: 'transparent' }}
                />
            </div>
        }>
            <BusinessBuilderPageContent />
        </Suspense>
    );
}
