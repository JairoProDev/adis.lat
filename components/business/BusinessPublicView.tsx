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
    IconFileAlt, IconEdit, IconPlus, IconBox, IconCheck, IconX,
    IconGrid, IconList, IconFilter
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
    profile: Partial<BusinessProfile>;
    adisos?: Adiso[];
    isPreview?: boolean;
    onEditPart?: (part: string) => void;
    editMode?: boolean;
    onUpdate?: (field: keyof BusinessProfile, value: any) => void;
    onEditProduct?: (product: Adiso) => void;
}

const DEFAULT_ADISOS: Adiso[] = [];

export default function BusinessPublicView({
    profile,
    adisos = DEFAULT_ADISOS,
    isPreview = false,
    onEditPart,
    editMode = false,
    onUpdate,
    onEditProduct
}: BusinessPublicViewProps) {
    const { user } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'inicio' | 'catalogo' | 'feed'>('catalogo');
    const [isHeaderCompact, setIsHeaderCompact] = useState(false);

    // Ownership check
    const isOwner = user?.id === profile.user_id || isPreview;

    // Catalog State & Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [filteredAdisos, setFilteredAdisos] = useState(adisos);

    // Pagination
    const ITEMS_PER_PAGE = viewMode === 'list' ? 12 : 24;
    const [currentPage, setCurrentPage] = useState(1);

    // Derived Categories
    const categories = Array.from(new Set(adisos.map(a => a.categoria || 'Otros').filter(Boolean)));

    // Update filtering effect
    useEffect(() => {
        let result = adisos;

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(a =>
                a.titulo.toLowerCase().includes(query) ||
                a.descripcion.toLowerCase().includes(query)
            );
        }

        if (selectedCategory) {
            result = result.filter(a => (a.categoria || 'Otros') === selectedCategory);
        }

        setFilteredAdisos(result);
        setCurrentPage(1); // Reset page
    }, [searchQuery, selectedCategory, adisos]);

    // Calculate pagination
    const totalPages = Math.ceil(filteredAdisos.length / ITEMS_PER_PAGE);
    const displayedAdisos = filteredAdisos.slice(
        currentPage * ITEMS_PER_PAGE
    );

    // Editing State
    const [editingField, setEditingField] = useState<string | null>(null);
    const [tempValue, setTempValue] = useState('');

    const startEditing = (field: string, value: string) => {
        setEditingField(field);
        setTempValue(value || '');
    };

    const saveField = (field: keyof BusinessProfile) => {
        onUpdate?.(field, tempValue);
        setEditingField(null);
    };

    const cancelEditing = () => {
        setEditingField(null);
        setTempValue('');
    };

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
                <div className="bg-yellow-300 text-yellow-900 text-center text-xs md:text-sm font-bold py-2 px-4 sticky top-0 z-50 animate-fade-in-down shadow-sm print:hidden">
                    📢 {profile.announcement_text}
                </div>
            )}

            {/* --- HERO SECTION & PROFILE HEADER --- */}
            <div className="bg-white pb-2 shadow-sm relative z-10">
                {/* Banner Wrapper - Maximized width but contained */}
                <div className="w-full relative group h-[200px] md:h-[350px] overflow-hidden bg-slate-100">
                    {profile.banner_url ? (
                        <img
                            src={profile.banner_url}
                            alt="Portada"
                            className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-r from-[var(--brand-color)] to-slate-800 opacity-90" />
                    )}
                    {/* Owner Banner Edit */}
                    {isOwner && (
                        <button
                            onClick={() => onEditPart?.('visual')}
                            className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 backdrop-blur-md text-white p-2 rounded-full transition-all opacity-0 group-hover:opacity-100"
                        >
                            <IconEdit size={18} />
                        </button>
                    )}
                </div>

                {/* Profile Info Bar - Logo overlaps banner */}
                <div className="max-w-6xl mx-auto px-4 md:px-8">
                    <div className="flex flex-col md:flex-row gap-4 md:gap-8 items-start relative">

                        {/* Logo Container - Negative margin to pull it UP */}
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="-mt-16 md:-mt-24 relative z-20 shrink-0"
                        >
                            <div className="w-32 h-32 md:w-48 md:h-48 rounded-full border-[6px] border-white bg-white shadow-xl overflow-hidden relative group/logo">
                                {profile.logo_url ? (
                                    <img src={profile.logo_url} alt="Logo" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-slate-100 flex items-center justify-center text-5xl font-bold text-slate-300">
                                        {profile.name?.substring(0, 1) || 'N'}
                                    </div>
                                )}
                                {isOwner && (
                                    <button
                                        onClick={() => onEditPart?.('logo')}
                                        className="absolute inset-0 bg-black/30 opacity-0 group-hover/logo:opacity-100 flex items-center justify-center text-white transition-opacity"
                                    >
                                        <IconEdit size={24} />
                                    </button>
                                )}
                            </div>
                            {/* Verified Badge */}
                            <div className="absolute bottom-2 right-2 bg-blue-500 text-white p-1.5 rounded-full border-4 border-white shadow-sm" title="Verificado">
                                <IconVerified size={16} />
                            </div>
                        </motion.div>

                        {/* Name & Bio & Actions */}
                        <div className="flex-1 pt-2 md:pt-4 w-full md:w-auto text-left">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <motion.h1
                                        className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-2 leading-none"
                                    >
                                        {profile.name || 'Mi Negocio'}
                                    </motion.h1>
                                    <p className="text-slate-500 text-sm md:text-lg max-w-2xl mx-auto md:mx-0 font-medium leading-relaxed">
                                        {profile.description || 'Bienvenido a nuestra tienda oficial.'}
                                    </p>

                                    {/* Quick Stats / Meta */}
                                    <div className="flex items-center justify-start gap-4 mt-3 text-sm text-slate-400 font-medium">
                                        {profile.contact_address && (
                                            <span className="flex items-center gap-1"><IconMapMarkerAlt size={14} /> {profile.contact_address}</span>
                                        )}
                                        <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded-full"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Abierto ahora</span>
                                    </div>
                                </div>

                                {/* Desktop Actions */}
                                <div className="hidden md:flex items-center gap-3">
                                    {profile.contact_whatsapp && (
                                        <a
                                            href={getWhatsappUrl(profile.contact_whatsapp, profile.name || 'Negocio')}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="bg-[var(--brand-color)] hover:brightness-110 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-[var(--brand-color)]/30 hover:-translate-y-1 transition-all flex items-center gap-2"
                                        >
                                            <IconWhatsapp size={20} /> Contáctanos
                                        </a>
                                    )}
                                    <button className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-3 rounded-xl transition-colors">
                                        <IconShareAlt size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* --- NAVIGATION TABS --- */}
                <div className="mt-8 border-t border-slate-100 bg-white sticky top-0 z-40 shadow-sm backdrop-blur-md bg-white/90 supports-[backdrop-filter]:bg-white/80">
                    <div className="max-w-6xl mx-auto px-4">
                        <div className="flex items-center gap-8 overflow-x-auto no-scrollbar mask-fade-right">
                            {[
                                { id: 'catalogo', label: 'Catálogo', icon: <IconStore size={18} />, count: adisos.length },
                                { id: 'inicio', label: 'Información', icon: <IconMapMarkerAlt size={18} /> },
                                { id: 'feed', label: 'Novedades', icon: <IconHeart size={18} /> }
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
                                            {profile.social_links?.map((link, idx) => (
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
                                            <a href={getWhatsappUrl(profile.contact_whatsapp, profile.name || 'Negocio')} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-white/20 p-3 rounded-xl hover:bg-white/30 transition-colors">
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
                                                    Object.entries(profile.business_hours || {}).map(([day, hours]) => (
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
                            {/* Catalog Header & Search & Categories */}
                            <div className="flex flex-col gap-6">

                                {/* Top Row: Search input + View Toggles - Single Line on Mobile */}
                                <div className="flex flex-row gap-3 items-center">
                                    {/* Modern Search Bar */}
                                    <div className="relative flex-1 group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[var(--brand-color)] transition-colors">
                                            <IconSearch size={22} />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Buscar en el catálogo..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl shadow-inner focus:ring-2 focus:ring-[var(--brand-color)]/20 focus:bg-white transition-all font-medium text-slate-700 outline-none"
                                        />
                                        {searchQuery && (
                                            <button
                                                onClick={() => setSearchQuery('')}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 bg-slate-200 text-slate-500 rounded-full p-1 hover:bg-slate-300"
                                            >
                                                <IconX size={14} />
                                            </button>
                                        )}
                                    </div>

                                    {/* View Mode Toggles - Inline on Desktop */}
                                    <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl self-start md:self-auto">
                                        <button
                                            onClick={() => setViewMode('grid')}
                                            className={cn("p-2.5 rounded-xl transition-all", viewMode === 'grid' ? "bg-white text-[var(--brand-color)] shadow-sm" : "text-slate-400 hover:text-slate-600")}
                                        >
                                            <IconGrid size={20} />
                                        </button>
                                        <button
                                            onClick={() => setViewMode('list')}
                                            className={cn("p-2.5 rounded-xl transition-all", viewMode === 'list' ? "bg-white text-[var(--brand-color)] shadow-sm" : "text-slate-400 hover:text-slate-600")}
                                        >
                                            <IconList size={20} />
                                        </button>
                                        <div className="w-[1px] h-6 bg-slate-200 mx-1 hidden md:block" />
                                        <button
                                            onClick={() => window.print()}
                                            className="hidden md:flex p-2.5 text-slate-400 hover:text-slate-600"
                                            title="Descargar PDF"
                                        >
                                            <IconFileAlt size={20} />
                                        </button>
                                    </div>
                                </div>

                                {/* Categories - Horizontal Scroll Pills */}
                                {categories.length > 0 && (
                                    <div className="overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 no-scrollbar mask-fade-right">
                                        <div className="flex gap-2.5">
                                            <button
                                                onClick={() => setSelectedCategory(null)}
                                                className={cn(
                                                    "px-5 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2",
                                                    !selectedCategory
                                                        ? "bg-[var(--brand-color)] text-white shadow-lg shadow-[var(--brand-color)]/25 ring-2 ring-[var(--brand-color)] ring-offset-2"
                                                        : "bg-white text-slate-600 border border-slate-200 hover:border-[var(--brand-color)] hover:text-[var(--brand-color)] hover:bg-slate-50"
                                                )}
                                            >
                                                <IconStore size={16} />
                                                Todos
                                            </button>
                                            {categories.map(cat => (
                                                <button
                                                    key={cat}
                                                    onClick={() => setSelectedCategory(cat)}
                                                    className={cn(
                                                        "px-5 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2",
                                                        selectedCategory === cat
                                                            ? "bg-[var(--brand-color)] text-white shadow-lg shadow-[var(--brand-color)]/25 ring-2 ring-[var(--brand-color)] ring-offset-2"
                                                            : "bg-white text-slate-600 border border-slate-200 hover:border-[var(--brand-color)] hover:text-[var(--brand-color)] hover:bg-slate-50"
                                                    )}
                                                >
                                                    {/* Generic Icon since we don't have category specific ones yet */}
                                                    <IconBox size={16} className={selectedCategory === cat ? "text-white" : "text-slate-400"} />
                                                    {cat}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Products Grid / List */}
                            {displayedAdisos.length > 0 ? (
                                <>
                                    <div className={cn(
                                        "grid gap-4 md:gap-6",
                                        viewMode === 'grid'
                                            ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
                                            : "grid-cols-1"
                                    )}>
                                        {displayedAdisos.map((adiso) => (
                                            viewMode === 'grid' ? (
                                                <BentoCard
                                                    key={adiso.id}
                                                    adiso={adiso}
                                                    icon={<IconBox size={14} className="text-[var(--brand-color)]" />}
                                                    onClick={() => router.push(`/adiso/${(adiso as any).slug || adiso.id}`)}
                                                    className="!rounded-2xl"
                                                    onEdit={isOwner ? (e) => {
                                                        e.stopPropagation();
                                                        if (onEditProduct) {
                                                            onEditProduct(adiso);
                                                        } else {
                                                            onEditPart?.('catalog');
                                                        }
                                                    } : undefined}
                                                />
                                            ) : (
                                                <div
                                                    key={adiso.id}
                                                    className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex gap-4 items-center group cursor-pointer"
                                                    onClick={() => router.push(`/adiso/${(adiso as any).slug || adiso.id}`)}
                                                >
                                                    <div className="w-24 h-24 flex-shrink-0 bg-slate-100 rounded-lg overflow-hidden relative">
                                                        {adiso.imagenUrl ? (
                                                            <img src={adiso.imagenUrl} alt={adiso.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                                <IconBox size={24} />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between">
                                                            <div>
                                                                <span className="text-xs font-bold text-[var(--brand-color)] uppercase tracking-wider mb-1 block">{adiso.categoria || 'Sin categoría'}</span>
                                                                <h3 className="font-bold text-lg text-slate-800 truncate mb-1 group-hover:text-[var(--brand-color)] transition-colors">{adiso.titulo}</h3>
                                                                <p className="text-sm text-slate-500 line-clamp-2">{adiso.descripcion}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className="text-xl font-black text-slate-900 block">
                                                                    {adiso.precio ? `S/ ${adiso.precio}` : 'Consultar'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {isOwner && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (onEditProduct) onEditProduct(adiso);
                                                            }}
                                                            className="p-2 bg-slate-100 text-slate-600 rounded-full hover:bg-[var(--brand-color)] hover:text-white transition-colors"
                                                        >
                                                            <IconEdit size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            )
                                        ))}
                                    </div>

                                    {/* Pagination Controls */}
                                    {totalPages > 1 && (
                                        <div className="flex justify-center items-center gap-4 mt-8 py-4">
                                            <button
                                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                disabled={currentPage === 1}
                                                className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                Anterior
                                            </button>
                                            <span className="text-sm font-medium text-slate-600">
                                                Página {currentPage} de {totalPages}
                                            </span>
                                            <button
                                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                disabled={currentPage === totalPages}
                                                className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                Siguiente
                                            </button>
                                        </div>
                                    )}
                                </>
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
            <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 print:hidden">
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
            </div>

            {/* Branding Footer */}
            <div className="py-8 text-center text-xs text-[var(--text-tertiary)] print:hidden">
                <p>Hecho con <span className="font-bold text-[var(--brand-blue)]">Buscadis Store</span></p>
            </div>

            {/* --- PRINTABLE CATALOG (Hidden on Screen) --- */}
            <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-8 overflow-y-auto w-full h-full">
                <div className="max-w-4xl mx-auto">
                    <PrintableCatalog profile={profile} adisos={filteredAdisos} />
                </div>
            </div>
        </div>
    );
}

// Separate component for clean printing
function PrintableCatalog({ profile, adisos }: { profile: Partial<BusinessProfile>, adisos: Adiso[] }) {
    return (
        <div className="w-full text-black bg-white">
            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-black pb-6 mb-8">
                <div className="flex items-center gap-6">
                    {profile.logo_url && (
                        <img src={profile.logo_url} alt="Logo" className="w-24 h-24 object-cover rounded-xl border border-gray-200" />
                    )}
                    <div>
                        <h1 className="text-4xl font-black mb-2">{profile.name}</h1>
                        <div className="text-sm font-medium space-y-1 text-gray-600">
                            {profile.contact_address && <p className="flex items-center gap-2">📍 {profile.contact_address}</p>}
                            {profile.contact_phone && <p className="flex items-center gap-2">📞 {profile.contact_phone}</p>}
                            {profile.contact_email && <p className="flex items-center gap-2">✉️ {profile.contact_email}</p>}
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="bg-black text-white text-xs font-bold px-3 py-1 rounded mb-2 inline-block">CATÁLOGO</div>
                    <p className="text-xs text-gray-500">Generado el {new Date().toLocaleDateString()}</p>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-3 gap-6">
                {adisos.map((product) => (
                    <div key={product.id} className="border border-gray-200 rounded-lg p-3 break-inside-avoid page-break-inside-avoid">
                        <div className="w-full h-40 bg-gray-100 rounded-md mb-3 overflow-hidden relative">
                            {product.imagenUrl ? (
                                <img src={product.imagenUrl} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300 font-bold text-xs uppercase">Sin Foto</div>
                            )}
                        </div>
                        <h3 className="font-bold text-sm mb-1 line-clamp-2 h-10">{product.titulo}</h3>
                        <p className="text-xs text-gray-500 mb-2 line-clamp-2 h-8">{product.descripcion}</p>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                            <span className="text-xs font-bold text-gray-400 uppercase">{product.categoria || 'Producto'}</span>
                            <span className="font-black text-lg">{product.precio ? `S/ ${product.precio}` : '-'}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="mt-12 pt-6 border-t border-gray-200 text-center text-xs text-gray-400">
                <p>Catálogo generado por {profile.name} - Precios sujetos a cambios.</p>
            </div>
        </div>
    );
}
