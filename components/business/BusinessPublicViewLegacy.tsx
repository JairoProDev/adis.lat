'use client';

import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { BusinessProfile } from '@/types/business';
import { Adiso } from '@/types';
import { cn } from '@/lib/utils';
import {
    IconStore, IconMapMarkerAlt, IconWhatsapp,
    IconHeart, IconPlus, IconSparkles
} from '@/components/Icons';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import NavbarMobile from '@/components/NavbarMobile';
import { useBusinessCart } from '@/hooks/useBusinessCart';
import BusinessHero from '@/components/business/public/BusinessHero';
import BusinessActionBar from '@/components/business/public/BusinessActionBar';
import BusinessHighlights from '@/components/business/public/BusinessHighlights';
import BusinessInfoTab from '@/components/business/public/BusinessInfoTab';
import BusinessDealsTab from '@/components/business/public/BusinessDealsTab';
import BusinessReviewsTab from '@/components/business/public/BusinessReviewsTab';
import BusinessCatalogTab, { PrintableCatalog } from '@/components/business/public/BusinessCatalogTab';
import BusinessShareTools from '@/components/business/public/BusinessShareTools';
import BusinessCartDrawer from '@/components/business/public/BusinessCartDrawer';
import BusinessJsonLd from '@/components/business/public/BusinessJsonLd';
import { getWhatsappUrl, businessThemeStyle } from '@/lib/business/public-utils';
import { IconStar } from '@/components/Icons';

interface BusinessPublicViewProps {
    profile: Partial<BusinessProfile> | null;
    adisos?: Adiso[];
    /** Filas crudas del catálogo (para firma del PDF en caché) */
    catalogProducts?: { id: string; updated_at?: string; images?: unknown }[];
    isPreview?: boolean;
    onEditPart?: (part: string) => void;
    editMode?: boolean;
    onUpdate?: (field: keyof BusinessProfile, value: any) => void;
    onEditProduct?: (product: Adiso) => void;
    chatbotMinimized?: boolean;
    onToggleChatbot?: () => void;
}

const DEFAULT_ADISOS: Adiso[] = [];

export default function BusinessPublicViewLegacy({
    profile,
    adisos = DEFAULT_ADISOS,
    catalogProducts = [],
    isPreview = false,
    onEditPart,
    editMode = false,
    onUpdate,
    onEditProduct,
    chatbotMinimized = true,
    onToggleChatbot
}: BusinessPublicViewProps) {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'inicio' | 'catalogo' | 'feed' | 'resenas'>('catalogo');

    const { items: cartItems, count: cartCount, open: cartOpen, setOpen: setCartOpen, addItem, updateQty, removeItem } = useBusinessCart(profile?.id);
    const [mounted, setMounted] = useState(false);
    const [printAdisos, setPrintAdisos] = useState(adisos);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Scroll Direction for Hide/Show Header/Nav
    const [showNav, setShowNav] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            if (currentScrollY > lastScrollY && currentScrollY > 100) {
                setShowNav(false); // Scrolling down
            } else {
                setShowNav(true); // Scrolling up
            }
            setLastScrollY(currentScrollY);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    const isOwner = mounted && user?.id && profile?.user_id && user.id === profile.user_id;
    const showEditControls = Boolean(isOwner && editMode);

    const handleShare = async () => {
        if (!profile) return;
        if (typeof navigator !== 'undefined' && navigator.share) {
            try {
                await navigator.share({
                    title: profile.name || 'Negocio en Adis',
                    text: profile.description || 'Mira este negocio en Adis',
                    url: window.location.href,
                });
            } catch (err) {
                console.log('Error sharing:', err);
            }
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert('Enlace copiado al portapapeles');
        }
    };

    useEffect(() => {
        if (!isPreview) {
            // reserved for future compact header behavior
        }
    }, [isPreview]);

    if (!profile) {
        return <div className="min-h-[50vh] flex items-center justify-center text-slate-400">Cargando perfil...</div>;
    }

    return (
        <div
            id="printable-content"
            className={cn(
                "min-h-screen bg-[var(--bg-secondary)] text-[var(--text-primary)]",
                profile.font_family === 'serif' ? 'font-serif' :
                    profile.font_family === 'mono' ? 'font-mono' : 'font-sans'
            )}
            style={businessThemeStyle(profile)}
        >
            <BusinessJsonLd profile={profile} products={adisos.slice(0, 5)} />
            <BusinessHighlights
                announcementText={profile.announcement_text}
                announcementActive={profile.announcement_active}
                customBlocks={profile.custom_blocks}
            />

            {/* --- HEADER (Scroll Aware) --- */}
            <div className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-transform duration-300",
                showNav ? "translate-y-0" : "-translate-y-full"
            )}>
                <Header
                    onToggleLeftSidebar={() => {/* No left sidebar logic here yet */ }}
                    ubicacion="Perú"
                    onUbicacionClick={() => { }}
                    seccionActiva="negocio"
                    onSeccionChange={() => { }}
                />
            </div>

            <BusinessHero
                profile={profile}
                showEditControls={Boolean(showEditControls)}
                onEditPart={onEditPart}
            />
            <BusinessActionBar
                profile={profile}
                isOwner={Boolean(isOwner)}
                cartCount={cartCount}
                onShare={handleShare}
                onOpenCart={() => setCartOpen(true)}
                onEditPart={onEditPart}
            />

            <div className="bg-white pb-2 shadow-sm relative z-10">
                {/* --- NAVIGATION TABS --- */}
                <div className="mt-8 border-t border-slate-100 bg-white sticky top-0 z-40 shadow-sm backdrop-blur-md bg-white/90 supports-[backdrop-filter]:bg-white/80 print:hidden">
                    <div className="max-w-6xl mx-auto px-4">
                        <div className="flex items-center gap-8 overflow-x-auto no-scrollbar mask-fade-right">
                            {[
                                { id: 'catalogo', label: 'Catálogo', icon: <IconStore size={18} />, count: adisos.length },
                                { id: 'inicio', label: 'Información', icon: <IconMapMarkerAlt size={18} /> },
                                { id: 'feed', label: 'Deals', icon: <IconHeart size={18} /> },
                                { id: 'resenas', label: 'Reseñas', icon: <IconStar size={18} /> },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={cn(
                                        "flex items-center gap-2 py-4 px-2 font-bold text-sm whitespace-nowrap transition-all border-b-2 relative",
                                        activeTab === tab.id
                                            ? "text-[var(--brand-color)] border-[var(--brand-color)]"
                                            : "text-slate-400 border-transparent hover:text-slate-600"
                                    )}
                                >
                                    {tab.icon}
                                    {tab.label}
                                    {tab.count !== undefined && (
                                        <span className={cn(
                                            "ml-1 px-2 py-0.5 rounded-full text-xs",
                                            activeTab === tab.id ? "bg-[var(--brand-color)]/10" : "bg-slate-100 text-slate-500"
                                        )}>{tab.count}</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div >

            {/* --- CONTENT AREA --- */}
            < div className="max-w-6xl mx-auto px-4 py-8 min-h-[50vh]" >
                <AnimatePresence mode="wait">

                    {activeTab === 'inicio' && (
                        <BusinessInfoTab profile={profile} adisos={adisos} />
                    )}

                    {activeTab === 'feed' && profile.slug && (
                        <BusinessDealsTab slug={profile.slug} businessName={profile.name || 'Negocio'} />
                    )}

                    {activeTab === 'resenas' && profile.slug && (
                        <BusinessReviewsTab slug={profile.slug} />
                    )}

                </AnimatePresence>

                <BusinessCatalogTab
                    profile={profile}
                    adisos={adisos}
                    catalogProducts={catalogProducts}
                    showEditControls={showEditControls}
                    onEditProduct={onEditProduct}
                    onEditPart={onEditPart}
                    addItem={addItem}
                    visible={activeTab === 'catalogo'}
                    onFilteredAdisosChange={setPrintAdisos}
                />
            </div >

            {/* --- FLOATING ACTION BUTTON --- */}
            <div className={cn(
                "fixed right-6 z-50 flex flex-col gap-3 print:hidden transition-all duration-500",
                showNav ? "bottom-32" : "bottom-6"
            )}>
                {
                    isOwner ? (
                        <>
                            {chatbotMinimized && onToggleChatbot && (
                                <button
                                    onClick={onToggleChatbot}
                                    className="w-14 h-14 bg-white text-[var(--brand-color)] border-2 border-[var(--brand-color)] rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform active:scale-95 group relative mb-2"
                                    title="Asistente IA"
                                >
                                    <IconSparkles size={24} />
                                    <span className="absolute right-full mr-3 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                        Asistente
                                    </span>
                                </button>
                            )}
                            <button
                                onClick={() => onEditPart?.('add-product')}
                                className="w-14 h-14 bg-[var(--brand-color)] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform active:scale-95 group relative"
                                title="Agregar Producto"
                            >
                                <IconPlus size={28} />
                                <span className="absolute right-full mr-3 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                    Nuevo Producto
                                </span>
                            </button>
                        </>
                    ) : (
                        profile.contact_whatsapp && (
                            <a
                                href={getWhatsappUrl(profile.contact_whatsapp, profile.name || 'Negocio')}
                                target="_blank"
                                rel="noreferrer"
                                className="w-14 h-14 bg-green-500 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform active:scale-95 group relative"
                            >
                                <IconWhatsapp size={28} />
                                <span className="absolute right-full mr-3 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                    WhatsApp
                                </span>
                            </a>
                        )
                    )}
            </div >

            <BusinessShareTools
                slug={profile.slug || ''}
                businessName={profile.name || 'Negocio'}
                onShare={handleShare}
            />

            <BusinessCartDrawer
                open={cartOpen}
                onClose={() => setCartOpen(false)}
                items={cartItems}
                businessName={profile.name || 'Negocio'}
                whatsapp={profile.contact_whatsapp}
                onUpdateQty={updateQty}
                onRemove={removeItem}
                slug={profile.slug || ''}
            />

            {/* Branding Footer */}
            <div className="py-8 text-center text-xs text-[var(--text-tertiary)] print:hidden" >
                <p>Hecho con <span className="font-bold text-[var(--brand-blue)]">Buscadis Store</span></p>
            </div>

            {/* --- PRINTABLE CATALOG (Hidden on Screen) --- */}
            < div className="printable-catalog hidden w-full bg-white p-8" >
                <div className="max-w-4xl mx-auto">
                    <PrintableCatalog profile={profile} adisos={printAdisos} />
                </div>
            </div >

            {/* --- NAVBAR MOBILE (Scroll Aware with Animation) --- */}
            <div className={cn(
                "fixed bottom-0 left-0 right-0 z-40 transition-transform duration-500 ease-in-out md:hidden",
                showNav ? "translate-y-0" : "translate-y-full"
            )}>
                <NavbarMobile
                    seccionActiva={null}
                    onCambiarSeccion={() => { }}
                    tieneAdisoAbierto={false}
                />
            </div>
        </div>
    );
}
