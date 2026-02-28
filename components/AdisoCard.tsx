'use client';

import React, { forwardRef, useState, useRef } from 'react';
import Image from 'next/image';
import { Adiso, Categoria, PAQUETES } from '@/types';
import {
    IconEye,
    IconLocation,
    IconClock,
    IconEmpleos,
    IconInmuebles,
    IconVehiculos,
    IconServicios,
    IconProductos,
    IconEventos,
    IconNegocios,
    IconComunidad,
    IconHeart,
    IconHeartOutline,
    IconClose
} from '@/components/Icons';
import { useAdInteraction } from '@/hooks/useAdInteraction';
import TrustBadge from '@/components/trust/TrustBadge';

// --- DATE FORMATTER (RELATIVE) ---
function getTimeAgo(dateString: string | undefined): string {
    if (!dateString) return '';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';

    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    // Evitar "Ahora" y manejar tiempos negativos (futuro) o muy cortos
    if (seconds < 60) return 'Hace instantes';
    if (seconds < 3600) return `Hace ${Math.floor(seconds / 60)} min`;
    if (seconds < 86400) return `Hace ${Math.floor(seconds / 3600)} h`;
    if (seconds < 604800) return `Hace ${Math.floor(seconds / 86400)} d`;
    return `Hace ${Math.floor(seconds / 604800)} sem`;
}

// --- CTA HELPER ---
const getCtaLink = (contacto: string, titulo: string) => {
    if (!contacto) return null;
    // Limpiar número
    const clean = contacto.replace(/\D/g, '');
    // Si parece número de Perú (9 dígitos, empieza con 9) o fijo (con código ciudad)
    if (clean.length >= 9) {
        return `https://wa.me/51${clean}?text=${encodeURIComponent(`Hola, vi tu anuncio "${titulo}" en Buscadis.`)}`;
    }
    if (contacto.includes('@')) return `mailto:${contacto}`;
    if (contacto.startsWith('http')) return contacto;
    return null;
};

// --- THEME ENGINE ---
const getCategoriaTheme = (categoria: Categoria) => {
    switch (categoria) {
        case 'empleos':
            return {
                text: 'text-blue-600 dark:text-blue-400',
                bg: 'bg-blue-50/50 dark:bg-blue-900/10',
                border: 'border-blue-100 dark:border-blue-800/30',
                gradient: 'from-[#2c3e50] to-[#4b79a1]',
                iconColor: 'text-white/90',
                badgeBg: 'bg-[#2c3e50] text-white shadow-lg shadow-blue-900/10'
            };
        case 'inmuebles':
            return {
                text: 'text-emerald-600 dark:text-emerald-400',
                bg: 'bg-emerald-50/50 dark:bg-emerald-900/10',
                border: 'border-emerald-100 dark:border-emerald-800/30',
                gradient: 'from-[#134E5E] to-[#71B280]',
                iconColor: 'text-white/90',
                badgeBg: 'bg-[#134E5E] text-white shadow-lg shadow-emerald-900/10'
            };
        case 'vehiculos':
            return {
                text: 'text-violet-600 dark:text-violet-400',
                bg: 'bg-violet-50/50 dark:bg-violet-900/10',
                border: 'border-violet-100 dark:border-violet-800/30',
                gradient: 'from-[#1A2980] to-[#26D0CE]',
                iconColor: 'text-white/90',
                badgeBg: 'bg-[#1A2980] text-white shadow-lg shadow-indigo-900/10'
            };
        case 'servicios':
            return {
                text: 'text-amber-600 dark:text-amber-400',
                bg: 'bg-amber-50/50 dark:bg-amber-900/10',
                border: 'border-amber-100 dark:border-amber-800/30',
                gradient: 'from-[#f2994a] to-[#f2c94c]',
                iconColor: 'text-white/90',
                badgeBg: 'bg-[#f2994a] text-white shadow-lg shadow-amber-900/10'
            };
        case 'productos':
            return {
                text: 'text-rose-600 dark:text-rose-400',
                bg: 'bg-rose-50/50 dark:bg-rose-900/10',
                border: 'border-rose-100 dark:border-rose-800/30',
                gradient: 'from-[#e52d27] to-[#b31217]',
                iconColor: 'text-white/90',
                badgeBg: 'bg-[#b31217] text-white shadow-lg shadow-rose-900/10'
            };
        case 'eventos':
            return {
                text: 'text-indigo-600 dark:text-indigo-400',
                bg: 'bg-indigo-50/50 dark:bg-indigo-900/10',
                border: 'border-indigo-100 dark:border-indigo-800/30',
                gradient: 'from-[#4facfe] to-[#00f2fe]',
                iconColor: 'text-white/90',
                badgeBg: 'bg-[#4facfe] text-white shadow-lg shadow-blue-900/10'
            };
        case 'negocios':
            return {
                text: 'text-slate-600 dark:text-slate-400',
                bg: 'bg-slate-50/50 dark:bg-slate-900/10',
                border: 'border-slate-100 dark:border-slate-800/30',
                gradient: 'from-[#434343] to-[#000000]',
                iconColor: 'text-white/90',
                badgeBg: 'bg-[#434343] text-white shadow-lg shadow-slate-900/10'
            };
        case 'comunidad':
            return {
                text: 'text-cyan-600 dark:text-cyan-400',
                bg: 'bg-cyan-50/50 dark:bg-cyan-900/10',
                border: 'border-cyan-100 dark:border-cyan-800/30',
                gradient: 'from-[#00c6ff] to-[#0072ff]',
                iconColor: 'text-white/90',
                badgeBg: 'bg-[#0072ff] text-white shadow-lg shadow-cyan-900/10'
            };
        default:
            return {
                text: 'text-zinc-600 dark:text-zinc-400',
                bg: 'bg-zinc-50/50 dark:bg-zinc-900/10',
                border: 'border-zinc-100 dark:border-zinc-800/30',
                gradient: 'from-[#bdc3c7] to-[#2c3e50]',
                iconColor: 'text-white/90',
                badgeBg: 'bg-[#2c3e50] text-white shadow-lg shadow-zinc-900/10'
            };
    }
};

const getCategoriaIcon = (categoria: Categoria) => {
    const iconMap = {
        empleos: IconEmpleos,
        inmuebles: IconInmuebles,
        vehiculos: IconVehiculos,
        servicios: IconServicios,
        productos: IconProductos,
        eventos: IconEventos,
        negocios: IconNegocios,
        comunidad: IconComunidad,
    };
    return iconMap[categoria] || IconEmpleos;
};

interface AdisoCardProps {
    adiso: Adiso;
    onClick: () => void;
    estaSeleccionado?: boolean;
    isDesktop?: boolean;
    vista?: 'grid' | 'list' | 'feed';
}

const AdisoCard = forwardRef<HTMLDivElement, AdisoCardProps>(({ adiso, onClick, estaSeleccionado, isDesktop = true, vista = 'grid' }, ref) => {
    const { isFavorite, isHidden, toggleFav, markNotInterested } = useAdInteraction(adiso.id);
    const IconComponent = getCategoriaIcon(adiso.categoria);
    const [isLongPressed, setIsLongPressed] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const theme = getCategoriaTheme(adiso.categoria);

    if (isHidden) return null;

    const imagenUrl = adiso.imagenesUrls?.[0] || adiso.imagenUrl;
    const tamaño = adiso.tamaño || 'miniatura';
    const paquete = PAQUETES[tamaño];

    const gridColumnSpan = paquete.columnas;
    const gridRowSpan = paquete.filas;

    // Fecha relativa short
    // Intentar obtener fecha y hora real (soportando snake_case de DB directa)
    let fechaRaw = adiso.fechaPublicacion || (adiso as any).fecha_publicacion;
    const horaRaw = (adiso as any).hora_publicacion || (adiso as any).horaPublicacion;

    if (fechaRaw && horaRaw && !fechaRaw.includes('T')) {
        // Combinar fecha y hora ISO para evitarUTC offset incorrecto al parsear solo fecha
        fechaRaw = `${fechaRaw}T${horaRaw}`;
    }

    const timeAgo = getTimeAgo(fechaRaw || (adiso as any).created_at);

    // Precio Logic
    let displayPrice = 'Contactar';

    if (adiso.precio && typeof adiso.precio === 'number' && adiso.precio > 0) {
        displayPrice = `S/ ${adiso.precio.toLocaleString('es-PE')}`;
    } else if (adiso.tipoPrecio === 'a_convenir') {
        displayPrice = 'A convenir';
    } else if (adiso.tipoPrecio === 'fijo' && adiso.precio === 0) {
        displayPrice = 'A convenir';
    }

    // Location
    const locationString = typeof adiso.ubicacion === 'string'
        ? adiso.ubicacion
        : `${(adiso.ubicacion as any)?.distrito || ''}, ${(adiso.ubicacion as any)?.provincia || 'Cusco'}`;

    // Botón Acción CTA
    const handleCta = (e: React.MouseEvent) => {
        e.stopPropagation();
        onClick(); // Abre sidebar

        const link = getCtaLink(adiso.contacto, adiso.titulo);
        if (link) {
            window.open(link, '_blank');
        }
    };

    return (
        <div
            ref={ref}
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick();
                }
            }}
            className={`
        group relative flex ${vista === 'list' ? 'flex-row' : 'flex-col'} items-start text-left bg-white dark:bg-slate-900 rounded-2xl border-none transition-all duration-500 overflow-hidden outline-none cursor-pointer font-sans
        ${estaSeleccionado
                    ? `ring-2 ring-sky-400 shadow-[0_20px_50px_rgba(56,189,248,0.2)] scale-[1.02] z-10`
                    : 'shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_30px_60px_rgba(0,0,0,0.12)] hover:-translate-y-2'
                }
        ${vista === 'feed' ? 'w-full shadow-md' : ''}
      `}
            style={{
                gridColumn: (vista === 'list' || vista === 'feed') ? '1 / -1' : `span ${gridColumnSpan}`,
                gridRow: (vista === 'list' || vista === 'feed') ? 'auto' : `span ${gridRowSpan}`,
                height: '100%',
                minHeight: vista === 'list' ? (isDesktop ? '180px' : '100px') : 'auto',
                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
            }}
            aria-label={`Ver detalles: ${adiso.titulo}`}
        >
            {/* --- Feed Header (Only for vista='feed') --- */}
            {vista === 'feed' && (
                <div className="w-full p-3 flex items-center justify-between border-b dark:border-obsidian-700">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 dark:bg-obsidian-700 relative border border-gray-200 dark:border-obsidian-600">
                            {adiso.vendedor?.avatarUrl ? (
                                <Image
                                    src={adiso.vendedor.avatarUrl}
                                    alt={adiso.vendedor.nombre}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className={`w-full h-full flex items-center justify-center ${theme.text}`}>
                                    <IconComponent size={18} />
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-900 dark:text-platinum-50 leading-none mb-1">
                                {adiso.vendedor?.nombre || 'Anunciante'}
                            </span>
                            <div className="flex items-center gap-1 text-[11px] text-gray-400 font-medium">
                                <IconLocation size={10} />
                                <span>{locationString}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* --- INTERACTION BUTTONS (Top Right) --- */}
            <div className={`absolute top-2 right-2 flex gap-1.5 z-30 transition-opacity duration-300 ${isDesktop || isLongPressed ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                {/* Favorite Button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleFav();
                    }}
                    className="p-1.5 rounded-full bg-black/20 backdrop-blur-md shadow-sm border border-white/20 hover:bg-white/40 hover:scale-110 active:scale-95 transition-all group/btn"
                    title={isFavorite ? "Quitar de favoritos" : "Guardar para más tarde"}
                >
                    {isFavorite ? (
                        <IconHeart size={14} className="text-red-500 drop-shadow-sm" />
                    ) : (
                        <IconHeartOutline size={14} className="text-white group-hover/btn:text-red-500 drop-shadow-sm" />
                    )}
                </button>

                {/* Not Interested Button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        markNotInterested();
                    }}
                    className="p-1.5 rounded-full bg-black/20 backdrop-blur-md shadow-sm border border-white/20 hover:bg-white/40 hover:scale-110 active:scale-95 transition-all group/btn"
                    title="No me interesa (Ocultar)"
                >
                    <IconClose size={14} className="text-white group-hover/btn:text-gray-200 drop-shadow-sm" />
                </button>
            </div>

            {/* --- Card Media Section --- */}
            {tamaño !== 'miniatura' && (
                <div
                    className={`
                        relative ${vista === 'list' ? 'w-[120px] md:w-[240px] h-full' : (vista === 'feed' ? 'w-full aspect-square' : 'w-full aspect-[4/3] md:aspect-video')} flex items-center justify-center overflow-hidden flex-shrink-0
                        bg-gradient-to-br ${theme.gradient} group
                    `}
                    onTouchStart={(e) => {
                        timerRef.current = setTimeout(() => {
                            setIsLongPressed(true);
                            if (navigator.vibrate) navigator.vibrate(50);
                        }, 600);
                    }}
                    onTouchEnd={(e) => {
                        if (timerRef.current) clearTimeout(timerRef.current);
                    }}
                    onTouchMove={(e) => {
                        if (timerRef.current) clearTimeout(timerRef.current);
                    }}
                    onClick={() => {
                        if (isLongPressed) {
                            setIsLongPressed(false);
                        }
                    }}
                >
                    {imagenUrl ? (
                        <>
                            <Image
                                src={imagenUrl}
                                alt={adiso.titulo}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                                loading="lazy"
                            />
                            {/* Modern Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-80" />
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center relative w-full h-full">
                            {/* Subtle Glassmorphism Overlay */}
                            <div className="absolute inset-0 opacity-20 bg-black/10" />
                            <IconComponent size={64} color="white" className="drop-shadow-2xl relative z-10 opacity-90" />
                        </div>
                    )}

                    {/* Top Identity Badge - Adapted for Mobile/Desktop (Hide in Feed View as it's in the header) */}
                    {vista !== 'feed' && (
                        <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start z-10 transition-transform group-hover:scale-105 origin-top-left">
                            {isDesktop ? (
                                // Desktop: Premium Pill Badge
                                <div className={`flex items-center gap-1.5 p-1 rounded-full backdrop-blur-md shadow-lg border border-white/20 transition-all ${theme.badgeBg}`}>
                                    {/* Small Avatar */}
                                    <div className="w-6 h-6 rounded-full overflow-hidden bg-white/20 flex-shrink-0 relative border border-white/20">
                                        {adiso.vendedor?.avatarUrl ? (
                                            <Image
                                                src={adiso.vendedor.avatarUrl}
                                                alt={adiso.vendedor.nombre}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-white">
                                                <IconComponent size={10} />
                                            </div>
                                        )}
                                    </div>
                                    {/* Compact Name Only */}
                                    <span className="text-[10px] font-bold text-white leading-none pr-1.5 truncate max-w-[80px]">
                                        {adiso.vendedor?.nombre || 'Anunciante'}
                                    </span>
                                </div>
                            ) : (
                                // Mobile: Minimal Circular Badge
                                <div className="w-8 h-8 rounded-full overflow-hidden bg-black/50 backdrop-blur-sm border border-white/20 shadow-lg relative">
                                    {adiso.vendedor?.avatarUrl ? (
                                        <Image
                                            src={adiso.vendedor.avatarUrl}
                                            alt={adiso.vendedor.nombre}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-white">
                                            <IconComponent size={14} />
                                        </div>
                                    )}
                                </div>
                            )}

                            {adiso.esDestacado && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-extrabold backdrop-blur-md bg-amber-400 text-amber-950 border border-amber-300/50 shadow-sm transition-all hover:scale-105 active:scale-95">
                                    ⭐ Destacado
                                </span>
                            )}
                        </div>
                    )}

                    {/* NEW: Location & Price Overlay at Bottom of Image (Hide Location in Feed View) */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 flex justify-between items-end z-20">
                        {vista !== 'feed' && (
                            <div className="flex items-center gap-1 text-[10px] font-medium text-white/90 truncate max-w-[70%] drop-shadow-md pb-0.5">
                                <IconLocation size={10} className="text-white flex-shrink-0" />
                                <span className="truncate">{locationString}</span>
                            </div>
                        )}

                        {/* Feed view price is more prominent */}
                        {vista === 'feed' && <div />}

                        {/* Price Badge */}
                        {(adiso.precio && adiso.precio > 0) && (
                            <div className={`
                                font-bold ${vista === 'feed' ? 'text-sm px-3 py-1.5' : 'text-[10px] px-2 py-1'} rounded shadow-md backdrop-blur-md
                                bg-white dark:bg-obsidian-700 text-[var(--brand-blue)] dark:text-platinum-100 border border-white/30 dark:border-obsidian-600 drop-shadow-md
                             `}>
                                {displayPrice}
                            </div>
                        )}
                    </div>

                    {/* Verified Badge Overlay */}
                    {adiso.vendedor?.esVerificado && (
                        <div className="absolute top-2 right-2 backdrop-blur-md bg-blue-500/20 rounded-full p-0.5 shadow-sm border border-blue-200/30 z-10">
                            <TrustBadge type="verified" size="sm" showLabel={false} />
                        </div>
                    )}
                </div>
            )}

            {/* --- Card Content --- */}
            <div className={`flex flex-col flex-1 w-full ${tamaño === 'miniatura' ? 'p-2' : (vista === 'feed' ? 'p-4' : 'p-3')}`}>

                {/* Title - UPPERCASE & BOLD & ADJUSTED SIZE */}
                <h3 className={`
            font-bold text-gray-900 dark:text-platinum-50 leading-tight tracking-tight mb-1 transition-colors line-clamp-2 uppercase
            ${vista === 'list' ? 'text-[12px] md:text-lg' : (vista === 'feed' ? 'text-lg mb-2' : (tamaño === 'miniatura' ? 'text-[11px]' : 'text-[13px] md:text-base'))}
            group-hover:${theme.text}
        `}>
                    {adiso.titulo}
                </h3>

                {/* Description (Hide on miniatura AND mobile, but show on Feed) */}
                {(tamaño !== 'miniatura' && (isDesktop || vista === 'feed')) && (
                    <p className={`text-slate-500 dark:text-platinum-400 font-medium mb-3 mt-1 leading-relaxed flex-1 ${vista === 'feed' ? 'text-sm' : 'text-[13px] line-clamp-2'}`}>
                        {adiso.descripcion}
                    </p>
                )}

                {/* Footer: Time & Stats */}
                <div className="flex justify-between items-center pt-2.5 mt-auto text-[10px] uppercase tracking-widest text-slate-400 dark:text-obsidian-400 font-bold w-full border-t border-slate-100 dark:border-obsidian-800/50">
                    <div className="flex items-center gap-1.5">
                        <IconClock size={11} className="text-sky-400 opacity-70" />
                        <span>{timeAgo}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <IconEye size={11} className="text-amber-400 opacity-70" />
                        <span>
                            {adiso.vistas || 0}
                            {isDesktop ? ' vistas' : ''}
                        </span>
                    </div>
                </div>

            </div>
        </div>
    );
});

AdisoCard.displayName = 'AdisoCard';

export default AdisoCard;
