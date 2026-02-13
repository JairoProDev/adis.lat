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
    IconFileAlt
} from '@/components/Icons';
import BentoCard from '@/components/BentoCard';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
}

export default function BusinessPublicView({ profile, adisos, isPreview = false }: BusinessPublicViewProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'inicio' | 'catalogo' | 'feed' | 'info'>('inicio');
    const [isHeaderCompact, setIsHeaderCompact] = useState(false);

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
            <div className="relative w-full h-[60vh] max-h-[500px] min-h-[350px] overflow-hidden group">
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
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                </div>

                {/* Main Content Overlay */}
                <div className="absolute bottom-0 left-0 w-full p-6 pb-20 md:pb-6 max-w-6xl mx-auto flex flex-col md:flex-row items-end md:items-center gap-6 z-10">

                    {/* Logo */}
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="relative"
                    >
                        <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl bg-white shadow-2xl p-1 overflow-hidden border-4 border-white/10 backdrop-blur-sm">
                            {profile.logo_url ? (
                                <img src={profile.logo_url} alt="Logo" className="w-full h-full object-cover rounded-xl" />
                            ) : (
                                <div className="w-full h-full bg-gray-100 flex items-center justify-center text-4xl font-bold text-gray-400">
                                    {profile.name.substring(0, 1)}
                                </div>
                            )}
                        </div>
                        {/* Verified Badge */}
                        <div className="absolute -bottom-2 -right-2 bg-blue-500 text-white rounded-full p-1 border-2 border-[var(--bg-secondary)]" title="Verificado">
                            <IconVerified size={16} />
                        </div>
                    </motion.div>

                    {/* Text Info */}
                    <div className="flex-1 text-white mb-2 md:mb-0">
                        <motion.h1
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            className="text-3xl md:text-5xl font-black tracking-tight mb-2 drop-shadow-md"
                        >
                            {profile.name}
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="text-white/80 text-sm md:text-base line-clamp-2 max-w-2xl"
                        >
                            {profile.description || 'Bienvenido a mi tienda digital.'}
                        </motion.p>

                        {/* Highlights (Location, Rating, Open Status) */}
                        <div className="flex flex-wrap gap-4 mt-4 text-xs md:text-sm font-medium">
                            {hasLocation && (
                                <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                                    <IconMapMarkerAlt className="text-[var(--brand-color)]" size={14} color={profile.theme_color} />
                                    <span>{profile.contact_address}</span>
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
                </div>
            </div>

            {/* --- NAVIGATION TABS (Sticky) --- */}
            <div className="sticky top-0 z-40 bg-[var(--bg-secondary)]/80 backdrop-blur-lg border-b border-[var(--border-subtle)]">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="flex items-center gap-8 overflow-x-auto no-scrollbar">
                        {[
                            { id: 'inicio', label: 'Inicio' },
                            { id: 'catalogo', label: 'Catálogo', count: adisos.length },
                            { id: 'feed', label: 'Publicaciones' },
                            { id: 'info', label: 'Información' }
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
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                        >
                            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                                <h3 className="font-bold text-xl md:text-2xl text-[var(--text-primary)]">
                                    Catálogo de Productos
                                </h3>

                                <div className="flex items-center gap-3 w-full md:w-auto">
                                    <div className="relative flex-1 md:w-64">
                                        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input
                                            type="text"
                                            placeholder="Buscar en el catálogo..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-full text-sm focus:outline-none focus:border-[var(--brand-color)] focus:ring-1 focus:ring-[var(--brand-color)] transition-all"
                                        />
                                    </div>
                                    <button
                                        onClick={() => window.print()}
                                        className="flex items-center gap-2 text-sm font-medium text-[var(--brand-color)] bg-[var(--brand-color)]/10 px-4 py-2 rounded-full hover:bg-[var(--brand-color)] hover:text-white transition-colors"
                                        title="Descargar Catálogo (PDF)"
                                    >
                                        <IconFileAlt size={16} />
                                        <span className="hidden sm:inline">Descargar</span>
                                    </button>
                                </div>
                            </div>

                            {filteredAdisos.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {filteredAdisos.map((adiso) => (
                                        <BentoCard
                                            key={adiso.id}
                                            adiso={adiso}
                                            icon={<IconStore size={12} />}
                                            onClick={() => router.push(`/adiso/${(adiso as any).slug || adiso.id}`)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-[var(--bg-primary)] rounded-3xl p-12 text-center border border-[var(--border-subtle)]">
                                    <div className="w-16 h-16 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center mx-auto mb-4 text-[var(--text-tertiary)]">
                                        <IconSearch size={32} />
                                    </div>
                                    <h4 className="font-bold text-[var(--text-secondary)] mb-2">No se encontraron productos</h4>
                                    <p className="text-sm text-[var(--text-tertiary)]">Intenta con otros términos o explora las categorías.</p>
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

                    {/* INFO TAB */}
                    {activeTab === 'info' && (
                        <motion.div
                            key="info"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="max-w-2xl mx-auto space-y-8"
                        >
                            {/* Location */}
                            <div className="bg-[var(--bg-primary)] p-6 rounded-3xl shadow-sm border border-[var(--border-subtle)]">
                                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                    <IconMapMarkerAlt className="text-[var(--brand-color)]" /> Ubicación
                                </h3>
                                <p className="text-[var(--text-secondary)] mb-4">{profile.contact_address || 'Dirección no especificada'}</p>
                                {/* Mock Map -> Real Map */}
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

                            {/* Hours */}
                            <div className="bg-[var(--bg-primary)] p-6 rounded-3xl shadow-sm border border-[var(--border-subtle)]">
                                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                    <IconClock className="text-[var(--brand-color)]" /> Horarios de Atención
                                </h3>
                                <div className="space-y-3">
                                    {Object.entries(profile.business_hours || {}).length > 0 ? (
                                        Object.entries(profile.business_hours).map(([day, hours]) => (
                                            <div key={day} className="flex justify-between text-sm py-2 border-b border-[var(--border-subtle)] last:border-0">
                                                <span className="font-medium capitalize">{day}</span>
                                                <span className={hours.closed ? "text-red-500 font-medium" : "text-[var(--text-secondary)]"}>
                                                    {hours.closed ? 'Cerrado' : `${hours.open} - ${hours.close}`}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'].map(day => (
                                            <div key={day} className="flex justify-between text-sm py-2 border-b border-[var(--border-subtle)] last:border-0">
                                                <span className="font-medium">{day}</span>
                                                <span className="text-[var(--text-secondary)]">9:00 AM - 6:00 PM (Ejemplo)</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Contact Form */}
                            {profile.show_contact_form !== false && (
                                <div className="bg-[var(--bg-primary)] p-6 rounded-3xl shadow-sm border border-[var(--border-subtle)]">
                                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                        <IconEnvelope className="text-[var(--brand-color)]" /> Contáctanos
                                    </h3>
                                    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert('¡Mensaje enviado! Nos pondremos en contacto pronto.'); }}>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <input type="text" placeholder="Tu Nombre" className="px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] outline-none focus:border-[var(--brand-color)] w-full text-sm" required />
                                            <input type="email" placeholder="Tu Email" className="px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] outline-none focus:border-[var(--brand-color)] w-full text-sm" required />
                                        </div>
                                        <textarea placeholder="¿En qué podemos ayudarte?" className="px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] outline-none focus:border-[var(--brand-color)] w-full min-h-[100px] text-sm" required></textarea>
                                        <button type="submit" className="w-full bg-[var(--brand-color)] text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-[var(--brand-color)]/20">
                                            Enviar Mensaje
                                        </button>
                                    </form>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* --- FLOATING ACTION BUTTON (Mobile) --- */}
            <div className="md:hidden fixed bottom-6 right-6 z-50">
                {profile.contact_whatsapp && (
                    <a
                        href={`https://wa.me/${profile.contact_whatsapp}`}
                        className="flex items-center justify-center w-14 h-14 bg-green-500 text-white rounded-full shadow-lg shadow-green-500/40 hover:scale-110 transition-transform"
                    >
                        <IconWhatsapp size={28} />
                    </a>
                )}
            </div>

            {/* Branding Footer */}
            <div className="py-8 text-center text-xs text-[var(--text-tertiary)]">
                <p>Hecho con <span className="font-bold text-[var(--brand-blue)]">Buscadis Store</span></p>
            </div>
        </div>
    );
}
