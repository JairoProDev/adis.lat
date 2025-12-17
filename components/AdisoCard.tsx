'use client';

import React, { forwardRef } from 'react';
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
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Ahora';
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
                text: 'text-blue-700',
                bg: 'bg-blue-50',
                border: 'border-blue-200',
                gradient: 'from-blue-50 to-blue-100',
                iconColor: 'text-blue-600',
                badgeBg: 'bg-blue-100/80 text-blue-800'
            };
        case 'inmuebles':
            return {
                text: 'text-emerald-700',
                bg: 'bg-emerald-50',
                border: 'border-emerald-200',
                gradient: 'from-emerald-50 to-emerald-100',
                iconColor: 'text-emerald-600',
                badgeBg: 'bg-emerald-100/80 text-emerald-800'
            };
        case 'vehiculos':
            return {
                text: 'text-violet-700',
                bg: 'bg-violet-50',
                border: 'border-violet-200',
                gradient: 'from-violet-50 to-violet-100',
                iconColor: 'text-violet-600',
                badgeBg: 'bg-violet-100/80 text-violet-800'
            };
        case 'servicios':
            return {
                text: 'text-amber-700',
                bg: 'bg-amber-50',
                border: 'border-amber-200',
                gradient: 'from-amber-50 to-amber-100',
                iconColor: 'text-amber-600',
                badgeBg: 'bg-amber-100/80 text-amber-800'
            };
        case 'productos':
            return {
                text: 'text-pink-700',
                bg: 'bg-pink-50',
                border: 'border-pink-200',
                gradient: 'from-pink-50 to-pink-100',
                iconColor: 'text-pink-600',
                badgeBg: 'bg-pink-100/80 text-pink-800'
            };
        case 'eventos':
            return {
                text: 'text-rose-700',
                bg: 'bg-rose-50',
                border: 'border-rose-200',
                gradient: 'from-rose-50 to-rose-100',
                iconColor: 'text-rose-600',
                badgeBg: 'bg-rose-100/80 text-rose-800'
            };
        case 'negocios':
            return {
                text: 'text-slate-700',
                bg: 'bg-slate-50',
                border: 'border-slate-200',
                gradient: 'from-slate-50 to-slate-100',
                iconColor: 'text-slate-600',
                badgeBg: 'bg-slate-100/80 text-slate-800'
            };
        case 'comunidad':
            return {
                text: 'text-cyan-700',
                bg: 'bg-cyan-50',
                border: 'border-cyan-200',
                gradient: 'from-cyan-50 to-cyan-100',
                iconColor: 'text-cyan-600',
                badgeBg: 'bg-cyan-100/80 text-cyan-800'
            };
        default:
            return {
                text: 'text-gray-700',
                bg: 'bg-gray-50',
                border: 'border-gray-200',
                gradient: 'from-gray-50 to-gray-100',
                iconColor: 'text-gray-600',
                badgeBg: 'bg-gray-100/80 text-gray-800'
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
}

const AdisoCard = forwardRef<HTMLDivElement, AdisoCardProps>(({ adiso, onClick, estaSeleccionado, isDesktop = true }, ref) => {
    const { isFavorite, isHidden, toggleFav, markNotInterested } = useAdInteraction(adiso.id);
    const IconComponent = getCategoriaIcon(adiso.categoria);
    const theme = getCategoriaTheme(adiso.categoria);

    if (isHidden) return null;

    const imagenUrl = adiso.imagenesUrls?.[0] || adiso.imagenUrl;
    const tamaño = adiso.tamaño || 'miniatura';
    const paquete = PAQUETES[tamaño];

    const gridColumnSpan = paquete.columnas;
    const gridRowSpan = paquete.filas;

    // Fecha relativa short
    const timeAgo = getTimeAgo(adiso.fechaPublicacion || (adiso as any).created_at);

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
        group relative flex flex-col items-start text-left bg-white rounded-xl border transition-all duration-300 overflow-hidden outline-none cursor-pointer font-sans
        ${estaSeleccionado
                    ? `ring-2 ring-offset-1 shadow-xl scale-[1.01] z-10 ${theme.border.replace('border-', 'ring-')}`
                    : 'border-gray-100 hover:border-gray-300 hover:shadow-lg hover:-translate-y-1'
                }
      `}
            style={{
                gridColumn: `span ${gridColumnSpan}`,
                gridRow: `span ${gridRowSpan}`,
                height: '100%',
                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
            }}
            aria-label={`Ver detalles: ${adiso.titulo}`}
        >
            {/* --- INTERACTION BUTTONS (Top Right) --- */}
            <div className="absolute top-2 right-2 flex gap-1.5 z-30">
                {/* Favorite Button */}
                <button
                    onClick={toggleFav}
                    className="p-1.5 rounded-full bg-white/90 shadow-sm border border-gray-100 hover:bg-white hover:scale-110 active:scale-95 transition-all group/btn"
                    title={isFavorite ? "Quitar de favoritos" : "Guardar para más tarde"}
                >
                    {isFavorite ? (
                        <IconHeart size={14} className="text-red-500" />
                    ) : (
                        <IconHeartOutline size={14} className="text-gray-400 group-hover/btn:text-red-500" />
                    )}
                </button>

                {/* Not Interested Button */}
                <button
                    onClick={markNotInterested}
                    className="p-1.5 rounded-full bg-white/90 shadow-sm border border-gray-100 hover:bg-white hover:scale-110 active:scale-95 transition-all group/btn"
                    title="No me interesa (Ocultar)"
                >
                    <IconClose size={14} className="text-gray-400 group-hover/btn:text-gray-700" />
                </button>
            </div>

            {/* --- Card Media Section --- */}
            {tamaño !== 'miniatura' && (
                <div className={`
            relative w-full aspect-[4/3] md:aspect-video flex items-center justify-center overflow-hidden flex-shrink-0
            bg-gradient-to-br ${theme.gradient} group
        `}>
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
                            {/* Gradient Overlay for Text Readability */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90" />
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center">
                            <IconComponent size={56} className={`${theme.iconColor} opacity-50 drop-shadow-sm`} />
                        </div>
                    )}

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start z-10">
                        <span className={`
                inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-extrabold backdrop-blur-md shadow-sm border border-white/20
                ${theme.badgeBg}
            `}>
                            <IconComponent size={10} />
                            {adiso.categoria}
                        </span>

                        {adiso.esDestacado && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-extrabold backdrop-blur-md bg-amber-400 text-amber-950 border border-amber-300/50 shadow-sm">
                                ⭐ Destacado
                            </span>
                        )}
                    </div>

                    {/* NEW: Location & Price Overlay at Bottom of Image */}
                    <div className="absolute bottom-0 left-0 right-0 p-2 flex justify-between items-end z-20">
                        <div className="flex items-center gap-1 text-[10px] font-medium text-white/90 truncate max-w-[70%] drop-shadow-md pb-0.5">
                            <IconLocation size={10} className="text-white flex-shrink-0" />
                            <span className="truncate">{locationString}</span>
                        </div>

                        {/* Price Badge (Only if numeric, simple badge, no button) */}
                        {(adiso.precio && adiso.precio > 0) && (
                            <div className={`
                                font-bold text-[10px] px-2 py-1 rounded shadow-sm backdrop-blur-md
                                bg-white/90 text-gray-900 border border-white/50
                             `}>
                                {displayPrice}
                            </div>
                        )}
                    </div>

                    {/* Verified Badge Overlay */}
                    {adiso.vendedor?.esVerificado && (
                        <div className="absolute top-2 right-2 backdrop-blur-md bg-white/90 rounded-full p-0.5 shadow-sm border border-gray-100 z-10">
                            <TrustBadge type="verified" size="sm" showLabel={false} />
                        </div>
                    )}
                </div>
            )}

            {/* --- Card Content --- */}
            <div className={`flex flex-col flex-1 w-full ${tamaño === 'miniatura' ? 'p-2' : 'p-3'}`}>

                {/* Title - UPPERCASE & BOLD & ADJUSTED SIZE */}
                <h3 className={`
            font-bold text-gray-900 leading-tight tracking-tight mb-1 transition-colors line-clamp-2 uppercase
            ${tamaño === 'miniatura' ? 'text-[11px]' : 'text-[13px] md:text-base'}
            group-hover:${theme.text}
        `}>
                    {adiso.titulo}
                </h3>

                {/* Description (Hide on miniatura AND mobile) */}
                {tamaño !== 'miniatura' && isDesktop && (
                    <p className="text-[13px] text-gray-500 font-medium line-clamp-2 mb-3 mt-1 leading-normal flex-1">
                        {adiso.descripcion}
                    </p>
                )}

                {/* Footer: Time & Stats */}
                <div className="flex justify-between items-center pt-2 mt-auto text-[10px] uppercase tracking-wider text-gray-400 font-bold w-full border-t border-gray-100/50">
                    <div className="flex items-center gap-1.5">
                        <IconClock size={10} className="text-gray-300" />
                        <span>{timeAgo}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <IconEye size={10} className="text-gray-300" />
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
