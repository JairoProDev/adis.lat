'use client';

import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Adiso } from '@/types';
import { formatFecha, getWhatsAppUrl, copiarLink, compartirNativo } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { isMyAdiso } from '@/lib/storage';
import { useAuth } from '@/hooks/useAuth';
import { esFavorito, toggleFavorito } from '@/lib/favoritos';
import { registrarVisualizacion, registrarClick, registrarContacto, registrarFavorito } from '@/lib/analytics';
import {
  IconClose,
  IconArrowLeft,
  IconArrowRight,
  IconCopy,
  IconShare,
  IconWhatsApp,
  IconCheck,
  IconLocation,
  IconCalendar,
  IconEmpleos,
  IconInmuebles,
  IconVehiculos,
  IconServicios,
  IconProductos,
  IconEventos,
  IconNegocios,
  IconComunidad,
  IconEdit,
  IconTrash,
  IconExternalLink
} from './Icons';
import { Categoria, UbicacionDetallada } from '@/types';
import { getAdisoUrl } from '@/lib/url';

function formatearUbicacion(ubicacion: any): { texto: string; coordenadas: { lat: number; lng: number } | null } {
  if (typeof ubicacion === 'object' && ubicacion !== null && 'distrito' in ubicacion) {
    const ubi = ubicacion as UbicacionDetallada;
    let texto = [ubi.distrito, ubi.provincia, ubi.departamento].filter(Boolean).join(', ');
    if (ubi.direccion) texto += `, ${ubi.direccion}`;
    const coords = (ubi.latitud && ubi.longitud) ? { lat: ubi.latitud, lng: ubi.longitud } : null;
    return { texto, coordenadas: coords };
  }
  return { texto: typeof ubicacion === 'string' ? ubicacion : 'Sin ubicación', coordenadas: null };
}

interface ModalAdisoProps {
  adiso: Adiso;
  onCerrar: () => void;
  onAnterior?: () => void;
  onSiguiente?: () => void;
  puedeAnterior: boolean;
  puedeSiguiente: boolean;
  dentroSidebar?: boolean;
  onEditar?: (adiso: Adiso) => void;
  onEliminar?: (adisoId: string) => void;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

const CATEGORIA_COLORS: Record<Categoria, { bg: string; text: string; label: string }> = {
  empleos:    { bg: '#dbeafe', text: '#1d4ed8', label: 'Empleos' },
  inmuebles:  { bg: '#dcfce7', text: '#15803d', label: 'Inmuebles' },
  vehiculos:  { bg: '#fef3c7', text: '#b45309', label: 'Vehículos' },
  servicios:  { bg: '#fae8ff', text: '#9333ea', label: 'Servicios' },
  productos:  { bg: '#ffedd5', text: '#c2410c', label: 'Productos' },
  eventos:    { bg: '#fce7f3', text: '#be185d', label: 'Eventos' },
  negocios:   { bg: '#e0f2fe', text: '#0369a1', label: 'Negocios' },
  comunidad:  { bg: '#f0fdf4', text: '#166534', label: 'Comunidad' },
};

export default function ModalAdiso({
  adiso,
  onCerrar,
  onAnterior,
  onSiguiente,
  puedeAnterior,
  puedeSiguiente,
  dentroSidebar = false,
  onEditar,
  onEliminar,
  onSuccess,
  onError
}: ModalAdisoProps) {
  const [copiado, setCopiado] = useState(false);
  const [imagenAmpliada, setImagenAmpliada] = useState<{ url: string; index: number } | null>(null);
  const [imagenActiva, setImagenActiva] = useState(0);
  const [mostrarConfirmarEliminar, setMostrarConfirmarEliminar] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [esFavoritoState, setEsFavoritoState] = useState(false);
  const [cargandoFavorito, setCargandoFavorito] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const esMiAdiso = isMyAdiso(adiso.id);
  const { user } = useAuth();
  const [vistasLocales, setVistasLocales] = useState(adiso.vistas || 0);
  const [contactosLocales, setContactosLocales] = useState(adiso.contactos || 0);

  const imagenes = adiso.imagenesUrls && adiso.imagenesUrls.length > 0
    ? adiso.imagenesUrls
    : adiso.imagenUrl ? [adiso.imagenUrl] : [];

  const catInfo = CATEGORIA_COLORS[adiso.categoria] || CATEGORIA_COLORS.productos;

  useEffect(() => {
    setVistasLocales(adiso.vistas || 0);
    setContactosLocales(adiso.contactos || 0);
    setImagenActiva(0);
  }, [adiso.id, adiso.vistas, adiso.contactos]);

  useEffect(() => {
    registrarVisualizacion(user?.id, adiso.id);
    setVistasLocales(prev => prev + 1);
  }, [user?.id, adiso.id]);

  useEffect(() => {
    if (user?.id) {
      esFavorito(user.id, adiso.id).then(setEsFavoritoState).catch(console.error);
    }
  }, [user?.id, adiso.id]);

  useEffect(() => {
    if (adiso && !dentroSidebar) {
      const seoUrl = getAdisoUrl(adiso);
      if (typeof window !== 'undefined' && window.location.pathname !== seoUrl && !window.location.pathname.includes('/admin')) {
        window.history.replaceState(null, '', seoUrl);
      }
    }
  }, [adiso, dentroSidebar]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (imagenAmpliada) setImagenAmpliada(null);
        else onCerrar();
      } else if (imagenAmpliada) {
        if (e.key === 'ArrowLeft' && imagenAmpliada.index > 0)
          setImagenAmpliada({ url: imagenes[imagenAmpliada.index - 1], index: imagenAmpliada.index - 1 });
        else if (e.key === 'ArrowRight' && imagenAmpliada.index < imagenes.length - 1)
          setImagenAmpliada({ url: imagenes[imagenAmpliada.index + 1], index: imagenAmpliada.index + 1 });
      } else {
        if (e.key === 'ArrowLeft' && puedeAnterior && onAnterior) onAnterior();
        else if (e.key === 'ArrowRight' && puedeSiguiente && onSiguiente) onSiguiente();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCerrar, onAnterior, onSiguiente, puedeAnterior, puedeSiguiente, imagenAmpliada, imagenes, adiso]);

  // Touch swipe for navigation
  const onTouchStart = (e: React.TouchEvent) => { setTouchEnd(null); setTouchStart(e.targetTouches[0].clientX); };
  const onTouchMove = (e: React.TouchEvent) => setTouchEnd(e.targetTouches[0].clientX);
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const dist = touchStart - touchEnd;
    if (dist > 50 && puedeSiguiente && onSiguiente) onSiguiente();
    else if (dist < -50 && puedeAnterior && onAnterior) onAnterior();
  };

  const handleToggleFavorito = async () => {
    if (!user?.id) return;
    setCargandoFavorito(true);
    try {
      const nuevoEstado = await toggleFavorito(user.id, adiso.id);
      setEsFavoritoState(nuevoEstado);
      if (nuevoEstado) registrarFavorito(user.id, adiso.id);
    } catch { alert('Error al guardar favorito'); }
    finally { setCargandoFavorito(false); }
  };

  const handleCopiarLink = async () => {
    try {
      await copiarLink(adiso.categoria, adiso.id);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {}
  };

  const handleContactar = async (contactoEspecifico?: string) => {
    const contactoAUsar = contactoEspecifico || adiso.contacto;
    const ahora = new Date();
    const estaCaducado = adiso.estaActivo === false || (adiso.fechaExpiracion && new Date(adiso.fechaExpiracion) < ahora);
    const esHistorico = adiso.esHistorico === true;

    if (estaCaducado || esHistorico) {
      const adminWhatsApp = '937054328';
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://adis.lat';
      const adisoUrl = `${baseUrl}${getAdisoUrl(adiso)}`;
      const mensaje = `Hola! Me interesa: ${adiso.titulo}\n${adisoUrl}\nRef: ${adiso.edicionNumero || adiso.id}`;
      if (user?.id) registrarContacto(user.id, adiso.id, adiso.categoria);
      window.open(`https://wa.me/51${adminWhatsApp}?text=${encodeURIComponent(mensaje)}`, '_blank');
      return;
    }

    setContactosLocales(prev => prev + 1);
    registrarContacto(user?.id, adiso.id, adiso.categoria);

    if (contactoEspecifico) {
      const contactoObj = adiso.contactosMultiples?.find(c => c.valor === contactoEspecifico);
      if (contactoObj?.tipo === 'email') {
        window.location.href = `mailto:${contactoAUsar}?subject=Interesado en: ${encodeURIComponent(adiso.titulo)}`;
      } else {
        window.open(getWhatsAppUrl(contactoAUsar, adiso.titulo, adiso.categoria, adiso.id), '_blank');
      }
    } else {
      window.open(getWhatsAppUrl(contactoAUsar, adiso.titulo, adiso.categoria, adiso.id), '_blank');
    }
  };

  const handleConfirmarEliminar = async () => {
    if (!onEliminar) return;
    setEliminando(true);
    try {
      await onEliminar(adiso.id);
      setMostrarConfirmarEliminar(false);
      onCerrar();
    } catch { setEliminando(false); }
  };

  const getCategoriaIcon = (categoria: Categoria) => {
    const map: Record<Categoria, React.ComponentType<any>> = {
      empleos: IconEmpleos, inmuebles: IconInmuebles, vehiculos: IconVehiculos,
      servicios: IconServicios, productos: IconProductos, eventos: IconEventos,
      negocios: IconNegocios, comunidad: IconComunidad,
    };
    return map[categoria];
  };

  const ahora = new Date();
  const esHistorico = adiso.esHistorico === true;
  const estaCaducado = adiso.estaActivo === false || esHistorico || (adiso.fechaExpiracion && new Date(adiso.fechaExpiracion) < ahora);

  // ── Contact Button ──────────────────────────────────────────────────────────
  const ContactButton = ({ fullWidth = false }: { fullWidth?: boolean }) => {
    const contactos = adiso.contactosMultiples?.length ? adiso.contactosMultiples : null;

    if (estaCaducado) {
      return (
        <button onClick={() => handleContactar()} className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-bold text-base text-white transition-all active:scale-[0.98]"
          style={{ backgroundColor: '#2563eb', boxShadow: '0 4px 16px rgba(37,99,235,0.35)' }}>
          <IconWhatsApp /> Consultar disponibilidad
        </button>
      );
    }

    if (contactos && contactos.length > 1) {
      return (
        <div className="flex flex-col gap-2 w-full">
          {contactos.slice(0, 3).map((c, i) => (
            <button key={i} onClick={() => handleContactar(c.valor)}
              className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-2xl font-bold text-base text-white transition-all active:scale-[0.98]"
              style={{
                backgroundColor: c.tipo === 'whatsapp' ? '#25D366' : '#2563eb',
                boxShadow: `0 4px 16px ${c.tipo === 'whatsapp' ? 'rgba(37,211,102,0.35)' : 'rgba(37,99,235,0.35)'}`
              }}>
              {c.tipo === 'whatsapp' ? <IconWhatsApp /> : '✉️'}
              {c.etiqueta || (i === 0 ? 'Contactar' : `Opción ${i + 1}`)}
            </button>
          ))}
        </div>
      );
    }

    return (
      <button onClick={() => handleContactar()}
        className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-bold text-base text-white transition-all active:scale-[0.98]"
        style={{ backgroundColor: '#25D366', boxShadow: '0 4px 16px rgba(37,211,102,0.35)' }}>
        <IconWhatsApp /> Contactar por WhatsApp
      </button>
    );
  };

  // ── Action Row ──────────────────────────────────────────────────────────────
  const ActionRow = () => (
    <div className="flex items-center gap-2">
      <button onClick={() => compartirNativo(adiso.categoria, adiso.id, adiso.titulo)}
        className="flex items-center justify-center w-10 h-10 rounded-full border transition-colors hover:bg-slate-50"
        style={{ borderColor: 'var(--border-color)' }} title="Compartir">
        <IconShare size={16} />
      </button>
      <button onClick={handleCopiarLink}
        className="flex items-center justify-center w-10 h-10 rounded-full border transition-all"
        style={{
          borderColor: copiado ? '#22c55e' : 'var(--border-color)',
          backgroundColor: copiado ? '#22c55e' : 'transparent',
          color: copiado ? 'white' : 'var(--text-secondary)'
        }} title="Copiar enlace">
        {copiado ? <IconCheck size={16} /> : <IconCopy size={16} />}
      </button>
      <button onClick={handleToggleFavorito} disabled={cargandoFavorito}
        className="flex items-center justify-center w-10 h-10 rounded-full border transition-colors hover:bg-slate-50"
        style={{ borderColor: 'var(--border-color)', color: esFavoritoState ? '#f59e0b' : 'var(--text-secondary)' }}
        title={esFavoritoState ? 'Quitar de favoritos' : 'Guardar en favoritos'}>
        {cargandoFavorito
          ? <div className="w-4 h-4 rounded-full border-2 border-gray-300 border-t-transparent animate-spin" />
          : <span className="text-base leading-none">{esFavoritoState ? '⭐' : '☆'}</span>}
      </button>
      {esMiAdiso && onEliminar && (
        <button onClick={() => setMostrarConfirmarEliminar(true)}
          className="flex items-center justify-center w-10 h-10 rounded-full border border-red-200 text-red-500 transition-colors hover:bg-red-50"
          title="Eliminar anuncio">
          <IconTrash size={16} />
        </button>
      )}
    </div>
  );

  // ── Main Content ─────────────────────────────────────────────────────────────
  const MainContent = () => (
    <div className="flex flex-col">
      {/* Image Gallery */}
      {imagenes.length > 0 && (
        <div className="relative">
          {/* Main image */}
          <div className="relative w-full bg-black/5" style={{ aspectRatio: imagenes.length === 1 ? '16/10' : '4/3', maxHeight: '400px' }}>
            <img
              src={imagenes[imagenActiva]}
              alt={`${adiso.titulo} - imagen ${imagenActiva + 1}`}
              className="w-full h-full object-contain cursor-zoom-in"
              onClick={() => setImagenAmpliada({ url: imagenes[imagenActiva], index: imagenActiva })}
              style={{ maxHeight: '400px' }}
            />
            {/* Nav arrows */}
            {imagenes.length > 1 && (
              <>
                <button
                  onClick={() => setImagenActiva(i => Math.max(0, i - 1))}
                  disabled={imagenActiva === 0}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center transition-all disabled:opacity-0"
                  style={{ backgroundColor: 'rgba(0,0,0,0.5)', color: 'white' }}>
                  <IconArrowLeft size={16} />
                </button>
                <button
                  onClick={() => setImagenActiva(i => Math.min(imagenes.length - 1, i + 1))}
                  disabled={imagenActiva === imagenes.length - 1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center transition-all disabled:opacity-0"
                  style={{ backgroundColor: 'rgba(0,0,0,0.5)', color: 'white' }}>
                  <IconArrowRight size={16} />
                </button>
                {/* Dots */}
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                  {imagenes.map((_, i) => (
                    <button key={i} onClick={() => setImagenActiva(i)}
                      className="rounded-full transition-all"
                      style={{
                        width: imagenActiva === i ? '20px' : '6px', height: '6px',
                        backgroundColor: imagenActiva === i ? 'white' : 'rgba(255,255,255,0.6)'
                      }} />
                  ))}
                </div>
              </>
            )}
          </div>
          {/* Thumbnails */}
          {imagenes.length > 1 && (
            <div className="flex gap-2 px-4 py-3 overflow-x-auto no-scrollbar">
              {imagenes.map((img, i) => (
                <button key={i} onClick={() => setImagenActiva(i)}
                  className="flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all"
                  style={{ borderColor: imagenActiva === i ? 'var(--brand-blue)' : 'transparent', opacity: imagenActiva === i ? 1 : 0.6 }}>
                  <img src={img} alt={`thumb ${i}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Content area */}
      <div className="px-5 py-4 space-y-5">
        {/* Category + status */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full"
            style={{ backgroundColor: catInfo.bg, color: catInfo.text }}>
            {(() => { const Icon = getCategoriaIcon(adiso.categoria); return <Icon size={12} />; })()}
            {catInfo.label}
          </span>
          {estaCaducado && (
            <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-gray-100 text-gray-500">
              {esHistorico ? 'Histórico' : 'Expirado'}
            </span>
          )}
        </div>

        {/* Title + price */}
        <div>
          <h1 className="text-xl font-black leading-tight mb-2" style={{ color: 'var(--text-primary)' }}>
            {adiso.titulo}
          </h1>
          {adiso.precio && (
            <div className="text-2xl font-black" style={{ color: 'var(--brand-blue)' }}>
              {typeof adiso.precio === 'number'
                ? new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(adiso.precio)
                : adiso.precio}
            </div>
          )}
        </div>

        {/* Meta info card */}
        <div className="rounded-2xl p-4 space-y-3" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          {/* Seller */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 relative"
              style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
              {adiso.vendedor?.avatarUrl ? (
                <Image src={adiso.vendedor.avatarUrl} alt={adiso.vendedor.nombre} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  {(() => { const Icon = getCategoriaIcon(adiso.categoria); return <Icon size={18} color="var(--text-tertiary)" />; })()}
                </div>
              )}
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Publicado por</div>
              <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{adiso.vendedor?.nombre || 'Anunciante'}</div>
            </div>
          </div>

          <div className="h-px" style={{ backgroundColor: 'var(--border-color)' }} />

          {/* Location */}
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ backgroundColor: 'rgba(59,130,246,0.1)' }}>
              <IconLocation size={14} color="var(--brand-blue)" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-tertiary)' }}>Ubicación</div>
              <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {formatearUbicacion(adiso.ubicacion).texto}
              </div>
            </div>
          </div>

          {/* Date */}
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ backgroundColor: 'rgba(59,130,246,0.1)' }}>
              <IconCalendar size={14} color="var(--brand-blue)" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-tertiary)' }}>Publicado</div>
              <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {formatFecha(adiso.fechaPublicacion, adiso.horaPublicacion)}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-4 pt-1">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">👁️</span>
              <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>{vistasLocales} vistas</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm">💬</span>
              <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>{contactosLocales} interesados</span>
            </div>
          </div>
        </div>

        {/* Description */}
        {adiso.descripcion && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-tertiary)' }}>Descripción</h3>
            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>
              {adiso.descripcion}
            </p>
          </div>
        )}

        {/* Action row */}
        <div className="flex items-center justify-between pt-1">
          <ActionRow />
          {/* Navigation */}
          {(puedeAnterior || puedeSiguiente) && (
            <div className="flex items-center gap-1">
              <button onClick={onAnterior} disabled={!puedeAnterior}
                className="w-9 h-9 rounded-full border flex items-center justify-center transition-all disabled:opacity-30"
                style={{ borderColor: 'var(--border-color)' }}>
                <IconArrowLeft size={14} />
              </button>
              <button onClick={onSiguiente} disabled={!puedeSiguiente}
                className="w-9 h-9 rounded-full border flex items-center justify-center transition-all disabled:opacity-30"
                style={{ borderColor: 'var(--border-color)' }}>
                <IconArrowRight size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Delete confirm */}
        {mostrarConfirmarEliminar && (
          <div className="p-4 rounded-2xl border-2 border-red-200 bg-red-50">
            <p className="font-bold text-red-800 text-sm mb-3">¿Eliminar este anuncio?</p>
            <p className="text-xs text-red-600 mb-4">Esta acción no se puede deshacer.</p>
            <div className="flex gap-2">
              <button onClick={() => setMostrarConfirmarEliminar(false)}
                className="flex-1 py-2.5 border-2 border-red-200 rounded-xl text-sm font-bold text-red-600 hover:bg-red-100 transition-colors">
                Cancelar
              </button>
              <button onClick={handleConfirmarEliminar} disabled={eliminando}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-colors disabled:opacity-50">
                {eliminando ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ── MOBILE BOTTOM SHEET ──────────────────────────────────────────────────────
  if (!isDesktop && !dentroSidebar) {
    return (
      <>
        <AnimatePresence>
          <div style={{ position: 'fixed', inset: 0, zIndex: 2000 }}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
              onClick={onCerrar} />

            {/* Sheet */}
            <motion.div
              drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={0.2}
              onDragEnd={(e, { offset, velocity }) => { if (offset.y > 100 || velocity.y > 500) onCerrar(); }}
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 300, mass: 0.8 }}
              style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                height: '94vh', backgroundColor: 'var(--bg-primary)',
                borderRadius: '24px 24px 0 0', display: 'flex', flexDirection: 'column',
                boxShadow: '0 -12px 48px rgba(0,0,0,0.25)', overflow: 'hidden'
              }}>
              {/* Handle + top bar */}
              <div style={{ padding: '10px 16px 12px', borderBottom: '1px solid var(--border-color)', flexShrink: 0 }}>
                <div className="flex justify-center mb-3">
                  <div className="w-10 h-1 rounded-full" style={{ backgroundColor: 'var(--border-color)' }} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                    {catInfo.label}
                  </span>
                  <button onClick={onCerrar}
                    className="w-9 h-9 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                    <IconClose size={18} />
                  </button>
                </div>
              </div>

              {/* Scrollable content */}
              <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <MainContent />
              </div>

              {/* Sticky CTA footer */}
              <div style={{
                padding: '16px', paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
                borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)',
                boxShadow: '0 -4px 16px rgba(0,0,0,0.06)', flexShrink: 0
              }}>
                <ContactButton fullWidth />
              </div>
            </motion.div>
          </div>
        </AnimatePresence>

        {/* Fullscreen image viewer */}
        {imagenAmpliada && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 3000, backgroundColor: 'black', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
            onClick={() => setImagenAmpliada(null)}>
            <button onClick={() => setImagenAmpliada(null)}
              style={{ position: 'absolute', top: 20, right: 20, color: 'white', background: 'rgba(255,255,255,0.15)', border: 'none', width: 44, height: 44, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
              <IconClose size={24} />
            </button>
            <img src={imagenAmpliada.url} alt="Full screen" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            {imagenAmpliada.index > 0 && (
              <button onClick={(e) => { e.stopPropagation(); setImagenAmpliada({ url: imagenes[imagenAmpliada.index - 1], index: imagenAmpliada.index - 1 }); }}
                style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'white', background: 'rgba(255,255,255,0.15)', border: 'none', width: 44, height: 44, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconArrowLeft size={20} />
              </button>
            )}
            {imagenAmpliada.index < imagenes.length - 1 && (
              <button onClick={(e) => { e.stopPropagation(); setImagenAmpliada({ url: imagenes[imagenAmpliada.index + 1], index: imagenAmpliada.index + 1 }); }}
                style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', color: 'white', background: 'rgba(255,255,255,0.15)', border: 'none', width: 44, height: 44, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconArrowRight size={20} />
              </button>
            )}
          </div>
        )}
      </>
    );
  }

  // ── DESKTOP PANEL / SIDEBAR ──────────────────────────────────────────────────
  return (
    <>
      <div
        style={{
          position: dentroSidebar ? 'relative' : 'fixed',
          inset: dentroSidebar ? 'auto' : 0,
          zIndex: dentroSidebar ? 'auto' : 1500,
          backgroundColor: dentroSidebar ? 'transparent' : 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'flex-end',
          backdropFilter: dentroSidebar ? 'none' : 'blur(4px)',
        }}
        onClick={(e) => { if (!dentroSidebar && e.target === e.currentTarget) onCerrar(); }}>
        <div style={{
          width: dentroSidebar ? '100%' : '480px',
          maxWidth: '100%',
          height: dentroSidebar ? '100%' : '100vh',
          backgroundColor: 'var(--bg-primary)',
          boxShadow: dentroSidebar ? 'none' : '-8px 0 48px rgba(0,0,0,0.12)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
        }} onClick={e => e.stopPropagation()}>

          {/* Desktop header */}
          {!dentroSidebar && (
            <div style={{
              padding: '16px 20px', borderBottom: '1px solid var(--border-color)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                  {catInfo.label}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ActionRow />
                <div style={{ width: 1, height: 24, backgroundColor: 'var(--border-color)', margin: '0 4px' }} />
                <button onClick={onCerrar}
                  style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', backgroundColor: 'var(--bg-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconClose size={18} />
                </button>
              </div>
            </div>
          )}

          {/* Scrollable content */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <MainContent />
          </div>

          {/* Sticky footer CTA */}
          <div style={{ padding: '20px', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', flexShrink: 0 }}>
            <ContactButton fullWidth />
          </div>
        </div>
      </div>

      {/* Fullscreen image viewer */}
      {imagenAmpliada && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 3000, backgroundColor: 'rgba(0,0,0,0.95)', display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(8px)' }}
          onClick={() => setImagenAmpliada(null)}>
          <button onClick={() => setImagenAmpliada(null)}
            style={{ position: 'absolute', top: 24, right: 24, color: 'white', background: 'rgba(255,255,255,0.15)', border: 'none', width: 48, height: 48, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconClose size={22} />
          </button>
          <img src={imagenAmpliada.url} alt="Full screen" style={{ maxWidth: '90%', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8 }} />
          {imagenAmpliada.index > 0 && (
            <button onClick={(e) => { e.stopPropagation(); setImagenAmpliada({ url: imagenes[imagenAmpliada.index - 1], index: imagenAmpliada.index - 1 }); }}
              style={{ position: 'absolute', left: 24, top: '50%', transform: 'translateY(-50%)', color: 'white', background: 'rgba(255,255,255,0.15)', border: 'none', width: 48, height: 48, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconArrowLeft size={22} />
            </button>
          )}
          {imagenAmpliada.index < imagenes.length - 1 && (
            <button onClick={(e) => { e.stopPropagation(); setImagenAmpliada({ url: imagenes[imagenAmpliada.index + 1], index: imagenAmpliada.index + 1 }); }}
              style={{ position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)', color: 'white', background: 'rgba(255,255,255,0.15)', border: 'none', width: 48, height: 48, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconArrowRight size={22} />
          </button>
          )}
        </div>
      )}
    </>
  );
}
