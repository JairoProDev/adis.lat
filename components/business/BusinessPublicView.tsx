'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BusinessProfile } from '@/types/business';
import { Adiso } from '@/types';
import { cn } from '@/lib/utils';
import {
    IconStore, IconMapMarkerAlt, IconWhatsapp, IconEnvelope,
    IconInstagram, IconFacebook, IconTiktok,
    IconVerified, IconShareAlt, IconGlobe, IconPhone, IconClock, IconChevronDown,
    IconLinkedin, IconYoutube, IconSearch, IconArrowRight, IconHeart,
    IconFileAlt, IconEdit, IconPlus, IconBox
} from '@/components/Icons';
import BentoCard from '@/components/BentoCard';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

// Helper for Social Icons
const getSocialIcon = (url: string) => {
    if (url.includes('facebook')) return <IconFacebook size={20} />;
    if (url.includes('instagram')) return <IconInstagram size={20} />;
    if (url.includes('tiktok')) return <IconTiktok size={20} />;
    if (url.includes('linkedin')) return <IconLinkedin size={20} />;
    if (url.includes('youtube')) return <IconYoutube size={20} />;
    return <IconGlobe size={20} />;
};

// WhatsApp Message
const getWhatsappUrl = (phone: string, businessName: string) => {
    const text = `Hola, vi su perfil de ${businessName} en Publicadis Business y me gustaría más información.`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
};

interface BusinessPublicViewProps {
    profile: BusinessProfile;
    adisos: Adiso[];
    isPreview?: boolean;
    onEditPart?: (part: string) => void;
}

export default function BusinessPublicView({ profile, adisos, isPreview = false, onEditPart }: BusinessPublicViewProps) {
    const { user } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'inicio' | 'catalogo' | 'feed'>('catalogo');
    const [isHeaderCompact, setIsHeaderCompact] = useState(false);

    // Ownership check
    const isOwner = user?.id === profile.user_id || isPreview;

    // Catalog State
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredAdisos, setFilteredAdisos] = useState(adisos);

    useEffect(() => {
        if (!searchQuery) {
            setFilteredAdisos(adisos);
        } else {
            const query = searchQuery.toLowerCase();
            setFilteredAdisos(adisos.filter(a =>
                a.titulo.toLowerCase().includes(query) ||
                a.descripcion.toLowerCase().includes(query)
            ));
        }
    }, [searchQuery, adisos]);

    // Derived State
    const hasSocials = profile.social_links && profile.social_links.length > 0;
    const hasLocation = !!profile.contact_address;
    const isOpen = true; // TODO: Calculate from business_hours

    // Scroll Handler for Sticky Header
    useEffect(() => {
        const handleScroll = () => {
            setIsHeaderCompact(window.scrollY > 150);
        };
        // Only add listener if not in preview mode or if we handle scroll container
        if (!isPreview) {
            window.addEventListener('scroll', handleScroll);
            return () => window.removeEventListener('scroll', handleScroll);
        }
    }, [isPreview]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <div
            className={cn(
                "min-h-screen bg-[var(--bg-secondary)] text-[var(--text-primary)]",
                profile.font_family === 'serif' ? 'font-serif' :
                    profile.font_family === 'mono' ? 'font-mono' : 'font-sans'
            )}
            style={{
                '--brand-color': profile.theme_color || '#3c6997',
                '--bg-primary': '#ffffff',
                '--bg-secondary': '#f8fafc',
                '--bg-tertiary': '#e2e8f0',
                '--text-primary': '#0f172a',
                '--text-secondary': '#475569',
                '--text-tertiary': '#94a3b8',
                '--border-color': '#e2e8f0',
                '--border-subtle': '#f1f5f9',
            } as React.CSSProperties}
        >
            {/* --- Sticky Announcement Bar --- */}
            {profile.announcement_active !== false && profile.announcement_text && (
                <div className="bg-yellow-300 text-yellow-900 text-center text-xs md:text-sm font-bold py-2 px-4 sticky top-0 z-50 animate-fade-in-down shadow-sm">
                    📢 {profile.announcement_text}
                </div>
            )}

            {/* --- HERO SECTION --- */}
            <div className="relative w-full h-[25vh] md:h-[30vh] max-h-[350px] min-h-[180px] overflow-hidden group">
                {/* Banner Image */}
                <div className="absolute inset-0 bg-gray-900">
                    {profile.banner_url ? (
                        <img
                            src={profile.banner_url}
                            alt="Banner"
                            className="w-full h-full object-cover object-center opacity-80 transition-transform duration-1000 group-hover:scale-105"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[var(--brand-color)] to-purple-900 opacity-80" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                </div>

                {/* Main Content Overlay */}
                <div className="absolute bottom-0 left-0 w-full p-6 pb-20 md:pb-8 max-w-6xl mx-auto flex flex-row items-end gap-3 md:gap-6 z-10 text-left">

                    {/* Logo */}
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="relative group/logo flex-shrink-0"
                    >
                        <div className="w-24 h-24 md:w-36 md:h-36 rounded-2xl bg-white shadow-xl p-1 overflow-hidden border-2 border-white/50 backdrop-blur-sm relative">
                            {profile.logo_url ? (
                                <img src={profile.logo_url} alt="Logo" className="w-full h-full object-cover rounded-xl" />
                            ) : (
                                <div className="w-full h-full bg-gray-100 flex items-center justify-center text-4xl font-bold text-gray-400">
                                    {profile.name.substring(0, 1)}
                                </div>
                            )}

                            {isOwner && (
                                <button
                                    onClick={() => onEditPart?.('logo')}
                                    className="absolute inset-0 bg-black/40 opacity-0 group-hover/logo:opacity-100 transition-opacity flex items-center justify-center text-white"
                                >
                                    <IconEdit size={24} />
                                </button>
                            )}
                        </div>
                        {/* Verified Badge */}
                        <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full p-1 border-2 border-[var(--bg-secondary)]" title="Verificado">
                            <IconVerified size={12} className="md:size-4" />
                        </div>
                    </motion.div>

                    {/* Text Info */}
                    <div className="flex-1 text-white mb-2 md:mb-4 relative group/info min-w-0">
                        <div className="relative inline-flex items-center gap-2 max-w-full">
                            <motion.h1
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                className="text-xl md:text-5xl font-black tracking-tight mb-0.5 md:mb-2 drop-shadow-md truncate"
                            >
                                {profile.name}
                            </motion.h1>
                            {isOwner && (
                                <button
                                    onClick={() => onEditPart?.('identity')}
                                    className="absolute -top-2 -right-8 opacity-0 group-hover/info:opacity-100 bg-white/20 p-1.5 rounded-full backdrop-blur-sm transition-all text-white scale-75"
                                >
                                    <IconEdit size={16} />
                                </button>
                            )}
                        </div>

                        <div className="relative">
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.1 }}
                                className="text-white/80 text-[10px] md:text-base line-clamp-1 md:line-clamp-2 max-w-2xl leading-tight"
                            >
                                {profile.description || 'Bienvenido a mi tienda digital.'}
                            </motion.p>
                            {isOwner && (
                                <button
                                    onClick={() => onEditPart?.('identity')}
                                    className="absolute -right-8 top-0 opacity-0 group-hover/info:opacity-100 bg-white/20 p-1.5 rounded-full backdrop-blur-sm transition-all text-white scale-75"
                                >
                                    <IconEdit size={16} />
                                </button>
                            )}
                        </div>

                        {/* Highlights (Desktop Status Only) */}
                        <div className="hidden md:flex flex-wrap justify-start gap-4 mt-4 text-xs md:text-sm font-medium">
                            {hasLocation && (
                                <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 group/loc relative">
                                    <IconMapMarkerAlt className="text-[var(--brand-color)]" size={14} color={profile.theme_color} />
                                    <span>{profile.contact_address}</span>
                                    {isOwner && (
                                        <button
                                            onClick={() => onEditPart?.('contact')}
                                            className="absolute -top-4 -right-2 opacity-0 group-hover/loc:opacity-100 bg-[var(--brand-color)] p-1 rounded-full text-white scale-75 transition-all"
                                        >
                                            <IconEdit size={12} />
                                        </button>
                                    )}
                                </div>
                            )}
                            <div className="flex items-center gap-1.5 bg-emerald-500/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-emerald-500/30 text-emerald-300">
                                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                <span>Abierto Ahora</span>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons (Desktop) */}
                    <div className="hidden md:flex gap-3">
                        {profile.contact_whatsapp && (
                            <a
                                href={getWhatsappUrl(profile.contact_whatsapp, profile.name)}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-green-500/30 hover:-translate-y-1"
                            >
                                <IconWhatsapp size={20} />
                                WhatsApp
                            </a>
                        )}
                        <button
                            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-xl font-bold backdrop-blur-md border border-white/10 transition-all"
                        >
                            <IconShareAlt size={20} />
                        </button>
                    </div>

                    {isOwner && (
                        <button
                            onClick={() => onEditPart?.('visual')}
                            className="absolute top-4 right-4 bg-white/10 hover:bg-white/30 backdrop-blur-md text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-md border border-white/20"
                            title="Editar Portada"
                        >
                            <IconEdit size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* --- NAVIGATION TABS (Sticky) --- */}
            <div className="sticky top-0 z-40 bg-[var(--bg-secondary)]/80 backdrop-blur-lg border-b border-[var(--border-subtle)]">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="flex items-center justify-center md:items-center md:justify-start gap-8 overflow-x-auto no-scrollbar">
                        {[
                            { id: 'catalogo', label: 'Catálogo', count: adisos.length },
                            { id: 'inicio', label: 'Sobre Nosotros' },
                            { id: 'feed', label: 'Publicaciones' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={cn(
                                    "relative py-4 px-2 font-bold text-sm whitespace-nowrap transition-colors",
                                    activeTab === tab.id ? "text-[var(--brand-color)]" : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                                )}
                            >
                                {tab.label}
                                {tab.count !== undefined && (
                                    <span className="ml-2 bg-[var(--bg-tertiary)] px-2 py-0.5 rounded-full text-xs text-[var(--text-primary)]">{tab.count}</span>
                                )}
                                {activeTab === tab.id && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute bottom-0 left-0 w-full h-[3px] bg-[var(--brand-color)] rounded-t-full"
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- CONTENT AREA --- */}
            <div className="max-w-6xl mx-auto px-4 py-8 min-h-[50vh]">
                <AnimatePresence mode="wait">

                    {/* INICIO TAB */}
                    {activeTab === 'inicio' && (
                        <motion.div
                            key="inicio"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
                        >
                            {/* Left Column: Quick Actions & Links */}
                            <div className="lg:col-span-1 space-y-6">
                                {/* Bio Card */}
                                <div className="bg-[var(--bg-primary)] p-6 rounded-3xl shadow-sm border border-[var(--border-subtle)]">
                                    <h3 className="font-bold text-lg mb-4">Sobre Nosotros</h3>
                                    <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-6">
                                        {profile.description || 'Sin descripción disponible.'}
                                    </p>

                                    {/* Socials */}
                                    {hasSocials && (
                                        <div className="flex gap-4 flex-wrap">
                                            {profile.social_links.map((link, idx) => (
                                                <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className="bg-[var(--bg-secondary)] p-3 rounded-full hover:bg-[var(--brand-color)] hover:text-white transition-all text-[var(--text-secondary)]">
                                                    {getSocialIcon(link.url)}
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Contact Card (Mobile Only mainly) */}
                                <div className="bg-[var(--brand-color)] text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                                    <h3 className="font-bold text-lg mb-4 relative z-10">Contáctanos</h3>
                                    <div className="space-y-4 relative z-10">
                                        {profile.contact_whatsapp && (
                                            <a href={getWhatsappUrl(profile.contact_whatsapp, profile.name)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-white/20 p-3 rounded-xl hover:bg-white/30 transition-colors">
                                                <IconWhatsapp size={20} />
                                                <span className="font-medium">Chatear por WhatsApp</span>
                                            </a>
                                        )}
                                        {profile.contact_phone && (
                                            <a href={`tel:${profile.contact_phone}`} className="flex items-center gap-3 bg-white/20 p-3 rounded-xl hover:bg-white/30 transition-colors">
                                                <IconPhone size={20} />
                                                <span className="font-medium">Llamar Ahora</span>
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Featured Content / Bento Grid */}
                            <div className="lg:col-span-2">
                                <div className="bg-[var(--bg-primary)] p-6 rounded-3xl shadow-sm border border-[var(--border-subtle)] mb-8">
                                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                        <IconMapMarkerAlt className="text-[var(--brand-color)]" /> Ubicación y Contacto
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <p className="text-[var(--text-secondary)] mb-4">{profile.contact_address || 'Dirección no especificada'}</p>
                                            <div className="w-full h-48 bg-[var(--bg-secondary)] rounded-xl overflow-hidden border border-[var(--border-color)]">
                                                <iframe
                                                    width="100%"
                                                    height="100%"
                                                    frameBorder="0"
                                                    scrolling="no"
                                                    marginHeight={0}
                                                    marginWidth={0}
                                                    src={`https://maps.google.com/maps?q=${encodeURIComponent(profile.contact_address || 'peru')}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                                                ></iframe>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <h4 className="font-bold text-sm text-[var(--text-secondary)] uppercase tracking-wider">Horarios</h4>
                                            <div className="space-y-2">
                                                {Object.entries(profile.business_hours || {}).length > 0 ? (
                                                    Object.entries(profile.business_hours).map(([day, hours]) => (
                                                        <div key={day} className="flex justify-between text-sm py-1 border-b border-[var(--border-subtle)] last:border-0 lowercase">
                                                            <span className="font-medium capitalize">{day}</span>
                                                            <span className={hours.closed ? "text-red-500 font-medium" : "text-[var(--text-secondary)]"}>
                                                                {hours.closed ? 'Cerrado' : `${hours.open} - ${hours.close}`}
                                                            </span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-sm text-[var(--text-tertiary)] italic">Consulte horarios directamente.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <h3 className="font-bold text-xl mb-6">Destacados</h3>
                                {adisos.length > 0 ? (
                                    <div className={cn(
                                        "grid gap-4",
                                        profile.layout_style === 'minimal' ? "grid-cols-1" :
                                            profile.layout_style === 'bento' ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3" : // Bento-ish via columns
                                                "grid-cols-1 sm:grid-cols-2" // Standard
                                    )}>
                                        {adisos.slice(0, 4).map((adiso, idx) => (
                                            <div key={adiso.id} className={cn(
                                                "transform hover:scale-[1.02] transition-transform",
                                                profile.layout_style === 'bento' && idx === 0 ? "md:col-span-2 md:row-span-2" : ""
                                            )}>
                                                <BentoCard
                                                    adiso={adiso}
                                                    icon={<IconStore size={12} />}
                                                    onClick={() => window.open(`/adiso/${(adiso as any).slug || adiso.id}`, '_blank')}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-[var(--bg-primary)] rounded-3xl p-12 text-center border border-[var(--border-subtle)] border-dashed">
                                        <div className="w-16 h-16 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center mx-auto mb-4 text-[var(--text-tertiary)]">
                                            <IconStore size={32} />
                                        </div>
                                        <h4 className="font-bold text-[var(--text-secondary)]">El catálogo está vacío</h4>
                                        <p className="text-sm text-[var(--text-tertiary)]">Pronto verás los productos destacados aquí.</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* CATALOGO TAB */}
                    {activeTab === 'catalogo' && (
                        <motion.div
                            key="catalogo"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="max-w-7xl mx-auto space-y-12"
                        >
                            {/* Catalog Header & Search */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div>
                                    <h2 className="text-4xl font-black text-slate-800 dark:text-zinc-100 flex items-center gap-3">
                                        Catálogo <span className="bg-[var(--brand-color)]/10 text-[var(--brand-color)] text-xs px-3 py-1 rounded-full">{filteredAdisos.length}</span>
                                    </h2>
                                    <p className="text-slate-500 font-medium italic">Selección premium exclusiva</p>
                                </div>

                                <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                                    <div className="relative w-full sm:w-80 group">
                                        <IconSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[var(--brand-color)] transition-colors" size={20} />
                                        <input
                                            type="text"
                                            placeholder="¿Qué buscas hoy?..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-14 pr-6 py-4 bg-white dark:bg-zinc-800 border-2 border-slate-100 dark:border-zinc-800 rounded-2xl shadow-sm focus:outline-none focus:border-[var(--brand-color)] focus:ring-4 focus:ring-[var(--brand-color)]/10 transition-all font-medium"
                                        />
                                    </div>
                                    <button
                                        onClick={() => window.print()}
                                        className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-2xl font-bold hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-slate-200 dark:shadow-none"
                                    >
                                        <IconFileAlt size={20} />
                                        <span>PDF</span>
                                    </button>
                                </div>
                            </div>

                            {/* Products Grid */}
                            {filteredAdisos.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                                    {filteredAdisos.map((adiso) => (
                                        <BentoCard
                                            key={adiso.id}
                                            adiso={adiso}
                                            icon={<IconBox size={14} className="text-[var(--brand-color)]" />}
                                            onClick={() => router.push(`/adiso/${(adiso as any).slug || adiso.id}`)}
                                            className="!rounded-2xl"
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="py-24 text-center">
                                    <div className="w-24 h-24 bg-slate-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200 dark:text-zinc-700">
                                        <IconSearch size={48} />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-400">Sin resultados</h3>
                                    <p className="text-slate-300">Intenta con otros términos</p>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* FEED TAB */}
                    {activeTab === 'feed' && (
                        <motion.div
                            key="feed"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="max-w-2xl mx-auto space-y-6"
                        >
                            <div className="bg-[var(--bg-primary)] p-8 rounded-3xl text-center shadow-sm border border-[var(--border-subtle)]">
                                <div className="w-20 h-20 bg-gradient-to-tr from-pink-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 text-white shadow-lg">
                                    <IconHeart size={32} />
                                </div>
                                <h3 className="font-bold text-2xl mb-3">Publicaciones Sociales</h3>
                                <p className="text-[var(--text-secondary)] mb-8 max-w-md mx-auto">
                                    Aquí podrás ver las últimas novedades, ofertas flash y contenido exclusivo de {profile.name}.
                                </p>
                                <div className="inline-flex items-center gap-2 bg-[var(--bg-secondary)] px-4 py-2 rounded-full text-sm font-medium text-[var(--text-secondary)]">
                                    <span className="relative flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--brand-color)] opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-[var(--brand-color)]"></span>
                                    </span>
                                    Próximamente
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* INFO TAB (FUSED INTO INICIO) */}

                </AnimatePresence>
            </div>

            {/* --- FLOATING ACTION BUTTON --- */}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
                {isOwner ? (
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
                ) : (
                    profile.contact_whatsapp && (
                        <a
                            href={getWhatsappUrl(profile.contact_whatsapp, profile.name)}
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
            </div>

            {/* Branding Footer */}
            <div className="py-8 text-center text-xs text-[var(--text-tertiary)]">
                <p>Hecho con <span className="font-bold text-[var(--brand-blue)]">Buscadis Store</span></p>
            </div>
        </div>
    );
}
