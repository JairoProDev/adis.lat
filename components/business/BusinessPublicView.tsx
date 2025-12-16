'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BusinessProfile } from '@/types/business';
import { Adiso } from '@/types';
import { cn } from '@/lib/utils';
import {
    IconStore, IconMapMarkerAlt, IconPhone, IconWhatsapp, IconEnvelope,
    IconGlobe, IconInstagram, IconFacebook, IconTiktok, IconShareAlt,
    IconVerified, IconClock, IconChevronDown
} from '@/components/Icons';
import BentoCard from '@/components/BentoCard';
import { useRouter } from 'next/navigation';

interface BusinessPublicViewProps {
    profile: BusinessProfile;
    adisos: Adiso[];
    isPreview?: boolean;
}

export default function BusinessPublicView({ profile, adisos, isPreview = false }: BusinessPublicViewProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'inicio' | 'catalogo' | 'info'>('inicio');
    const [isHeaderCompact, setIsHeaderCompact] = useState(false);

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
            className="min-h-screen bg-[var(--bg-secondary)] font-sans text-[var(--text-primary)]"
            style={{
                '--brand-color': profile.theme_color || '#3c6997'
            } as React.CSSProperties}
        >
            {/* --- HERO SECTION --- */}
            <div className="relative w-full h-[60vh] max-h-[500px] min-h-[350px] overflow-hidden">
                {/* Banner Image */}
                <div className="absolute inset-0 bg-gray-900">
                    {profile.banner_url ? (
                        <img
                            src={profile.banner_url}
                            alt="Banner"
                            className="w-full h-full object-cover opacity-80"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[var(--brand-color)] to-purple-900 opacity-80" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
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
                                href={`https://wa.me/${profile.contact_whatsapp}`}
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
                                    {hasSocials ? (
                                        <div className="flex gap-4">
                                            {/* Mock rendering socials */}
                                            {profile.social_links.map((link, idx) => (
                                                <a key={idx} href={link.url} target="_blank" className="bg-[var(--bg-secondary)] p-3 rounded-full hover:bg-[var(--brand-color)] hover:text-white transition-all">
                                                    <IconGlobe size={18} />
                                                </a>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex gap-3">
                                            {/* Placeholder socials */}
                                            <div className="bg-[var(--bg-tertiary)] p-3 rounded-full text-[var(--text-tertiary)]"><IconInstagram size={18} /></div>
                                            <div className="bg-[var(--bg-tertiary)] p-3 rounded-full text-[var(--text-tertiary)]"><IconFacebook size={18} /></div>
                                        </div>
                                    )}
                                </div>

                                {/* Contact Card (Mobile Only mainly) */}
                                <div className="bg-[var(--brand-color)] text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                                    <h3 className="font-bold text-lg mb-4 relative z-10">Contáctanos</h3>
                                    <div className="space-y-4 relative z-10">
                                        {profile.contact_whatsapp && (
                                            <a href={`https://wa.me/${profile.contact_whatsapp}`} className="flex items-center gap-3 bg-white/20 p-3 rounded-xl hover:bg-white/30 transition-colors">
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
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {adisos.slice(0, 4).map((adiso) => (
                                            <div key={adiso.id} className="transform hover:scale-[1.02] transition-transform">
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
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-xl">Todos los Productos</h3>
                                {/* Filter Button Placeholder */}
                                <button className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] bg-[var(--bg-primary)] px-4 py-2 rounded-full border border-[var(--border-subtle)] shadow-sm">
                                    Filtrar <IconChevronDown size={12} />
                                </button>
                            </div>

                            {adisos.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {adisos.map((adiso) => (
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
                                    <p>No hay productos disponibles.</p>
                                </div>
                            )}
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
                                {/* Mock Map */}
                                <div className="w-full h-48 bg-[var(--bg-secondary)] rounded-xl flex items-center justify-center text-[var(--text-tertiary)] text-sm font-medium border border-[var(--border-color)]">
                                    Google Maps Placeholder
                                </div>
                            </div>

                            {/* Hours */}
                            <div className="bg-[var(--bg-primary)] p-6 rounded-3xl shadow-sm border border-[var(--border-subtle)]">
                                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                    <IconClock className="text-[var(--brand-color)]" /> Horarios de Atención
                                </h3>
                                <div className="space-y-3">
                                    {/* Mock hours */}
                                    {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'].map(day => (
                                        <div key={day} className="flex justify-between text-sm py-2 border-b border-[var(--border-subtle)] last:border-0">
                                            <span className="font-medium">{day}</span>
                                            <span className="text-[var(--text-secondary)]">9:00 AM - 6:00 PM</span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between text-sm py-2 text-red-500 font-medium">
                                        <span>Domingo</span>
                                        <span>Cerrado</span>
                                    </div>
                                </div>
                            </div>
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
                <p>Powered by <span className="font-bold text-[var(--brand-blue)]">Buscadis Store</span></p>
            </div>
        </div>
    );
}
