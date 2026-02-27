'use client';

import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
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

// Función helper para formatear ubicación
function formatearUbicacion(ubicacion: any): { texto: string; coordenadas: { lat: number; lng: number } | null } {
  if (typeof ubicacion === 'object' && ubicacion !== null && 'distrito' in ubicacion) {
    const ubi = ubicacion as UbicacionDetallada;
    let texto = `${ubi.distrito || ''}, ${ubi.provincia || ''}, ${ubi.departamento || ''}`.replace(/^,\s*|,\s*$/g, '');
    if (ubi.direccion) {
      texto += `, ${ubi.direccion}`;
    }
    const coords = (ubi.latitud && ubi.longitud) ? { lat: ubi.latitud, lng: ubi.longitud } : null;
    return { texto, coordenadas: coords };
  }
  return {
    texto: typeof ubicacion === 'string' ? ubicacion : 'Sin ubicación',
    coordenadas: null
  };
}

interface ModalAdisoProps {
  adiso: Adiso;
  onCerrar: () => void;
  onAnterior?: () => void;
  onSiguiente?: () => void;
  puedeAnterior: boolean;
  puedeSiguiente: boolean;
  dentroSidebar?: boolean; // Indica si está dentro del sidebar (sin overlay)
  onEditar?: (adiso: Adiso) => void; // Callback para editar adiso
  onEliminar?: (adisoId: string) => void; // Callback para eliminar adiso
  onSuccess?: (message: string) => void; // Callback para mensajes de éxito
  onError?: (message: string) => void; // Callback para mensajes de error
}

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
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [imagenAmpliada, setImagenAmpliada] = useState<{ url: string; index: number } | null>(null);
  const [mostrarConfirmarEliminar, setMostrarConfirmarEliminar] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [esFavoritoState, setEsFavoritoState] = useState(false);
  const [cargandoFavorito, setCargandoFavorito] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const esMiAdiso = isMyAdiso(adiso.id);
  const { user } = useAuth();

  const minSwipeDistance = 50;

  // Cargar estado de favorito
  useEffect(() => {
    if (user?.id) {
      esFavorito(user.id, adiso.id).then(setEsFavoritoState).catch(console.error);
    }
  }, [user?.id, adiso.id]);

  const [vistasLocales, setVistasLocales] = useState(adiso.vistas || 0);
  const [contactosLocales, setContactosLocales] = useState(adiso.contactos || 0);

  // Cuando cambia el adiso, reiniciamos el estado local con los valores del nuevo adiso
  useEffect(() => {
    setVistasLocales(adiso.vistas || 0);
    setContactosLocales(adiso.contactos || 0);
  }, [adiso.id, adiso.vistas, adiso.contactos]);

  // Registrar visualización del adiso (Optimistic + Backend)
  useEffect(() => {
    // Backend
    registrarVisualizacion(user?.id, adiso.id);
    // Optimistic UI: Incrementamos 1 sobre el valor base
    setVistasLocales(prev => prev + 1);
  }, [user?.id, adiso.id]);


  const handleToggleFavorito = async () => {
    if (!user?.id) {
      // TODO: Mostrar modal de autenticación
      return;
    }

    setCargandoFavorito(true);
    try {
      const nuevoEstado = await toggleFavorito(user.id, adiso.id);
      setEsFavoritoState(nuevoEstado);
      // Registrar favorito solo si se agregó (no si se removió)
      if (nuevoEstado) {
        registrarFavorito(user.id, adiso.id);
      }
    } catch (error) {
      console.error('Error al toggle favorito:', error);
      alert('Error al guardar favorito');
    } finally {
      setCargandoFavorito(false);
    }
  };

  const getCategoriaTheme = (categoria: Categoria) => {
    const themes: Record<Categoria, { color: string; bg: string; iconBg: string }> = {
      empleos: { color: 'var(--brand-blue)', bg: 'rgba(56, 189, 248, 0.1)', iconBg: 'from-sky-400 to-blue-600' },
      inmuebles: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', iconBg: 'from-emerald-400 to-teal-600' },
      vehiculos: { color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)', iconBg: 'from-violet-400 to-purple-600' },
      servicios: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', iconBg: 'from-amber-400 to-orange-600' },
      productos: { color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.1)', iconBg: 'from-rose-400 to-pink-600' },
      eventos: { color: '#6366f1', bg: 'rgba(99, 102, 241, 0.1)', iconBg: 'from-indigo-400 to-violet-600' },
      negocios: { color: '#64748b', bg: 'rgba(100, 116, 139, 0.1)', iconBg: 'from-slate-400 to-slate-600' },
      comunidad: { color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.1)', iconBg: 'from-cyan-400 to-sky-600' },
    };
    return themes[categoria] || themes.productos;
  };

  const theme = getCategoriaTheme(adiso.categoria);

  const getCategoriaIcon = (categoria: Categoria): React.ComponentType<{ size?: number; color?: string; className?: string }> => {
    const iconMap: Record<Categoria, React.ComponentType<{ size?: number; color?: string; className?: string }>> = {
      empleos: IconEmpleos,
      inmuebles: IconInmuebles,
      vehiculos: IconVehiculos,
      servicios: IconServicios,
      productos: IconProductos,
      eventos: IconEventos,
      negocios: IconNegocios,
      comunidad: IconComunidad,
    };
    return iconMap[categoria];
  };

  // Actualizar URL del navegador al abrir adiso (SEO Friendly)
  useEffect(() => {
    // Solo actualizar URL si NO estamos en el sidebar (para evitar conflictos con el estado de la home)
    // O si estamos en modo standalone/mobile específico
    if (adiso && !dentroSidebar) {
      const seoUrl = getAdisoUrl(adiso);
      // Solo actualizar si es diferente para no llenar el historial
      if (typeof window !== 'undefined' && window.location.pathname !== seoUrl && !window.location.pathname.includes('/admin')) {
        window.history.replaceState(null, '', seoUrl);
      }
    }
  }, [adiso, dentroSidebar]);


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (imagenAmpliada) {
          setImagenAmpliada(null);
        } else {
          onCerrar();
        }
      } else if (imagenAmpliada) {
        // Navegación entre imágenes ampliadas
        const imagenes = adiso.imagenesUrls && adiso.imagenesUrls.length > 0
          ? adiso.imagenesUrls
          : adiso.imagenUrl ? [adiso.imagenUrl] : [];

        if (e.key === 'ArrowLeft' && imagenAmpliada.index > 0) {
          setImagenAmpliada({ url: imagenes[imagenAmpliada.index - 1], index: imagenAmpliada.index - 1 });
        } else if (e.key === 'ArrowRight' && imagenAmpliada.index < imagenes.length - 1) {
          setImagenAmpliada({ url: imagenes[imagenAmpliada.index + 1], index: imagenAmpliada.index + 1 });
        }
      } else if (e.key === 'ArrowLeft' && puedeAnterior && onAnterior) {
        onAnterior();
      } else if (e.key === 'ArrowRight' && puedeSiguiente && onSiguiente) {
        onSiguiente();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCerrar, onAnterior, onSiguiente, puedeAnterior, puedeSiguiente, imagenAmpliada, adiso]);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && puedeSiguiente && onSiguiente) {
      onSiguiente();
    } else if (isRightSwipe && puedeAnterior && onAnterior) {
      onAnterior();
    }
  };

  const handleCopiarLink = async () => {
    try {
      await copiarLink(adiso.categoria, adiso.id);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch (error) {
      console.error('Error al copiar:', error);
    }
  };

  const handleCompartir = async () => {
    await compartirNativo(adiso.categoria, adiso.id, adiso.titulo);
  };

  const handleContactar = async (contactoEspecifico?: string) => {
    const contactoAUsar = contactoEspecifico || adiso.contacto;

    // Verificar si el anuncio está caducado o es histórico
    const ahora = new Date();
    const estaCaducado =
      adiso.estaActivo === false ||
      (adiso.fechaExpiracion && new Date(adiso.fechaExpiracion) < ahora);
    const esHistorico = adiso.esHistorico === true;

    if (estaCaducado || esHistorico) {
      // Anuncio caducado o histórico - redirigir a WhatsApp del admin
      // Número de WhatsApp del administrador (sin +51 ni espacios)
      const adminWhatsApp = '937054328'; // Tu número de WhatsApp

      // Generar URL completa del aviso
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://adis.lat';
      const adisoUrl = `${baseUrl}${getAdisoUrl(adiso)}`;

      // Crear mensaje que parezca natural del usuario pero con info necesaria
      // Incluye el link para que puedas acceder rápidamente a la info del anunciante
      const mensaje = `Hola! Me interesa este anuncio: ${adiso.categoria === 'inmuebles' ? '¿Sigue disponible?' :
        adiso.categoria === 'empleos' ? '¿Aún están contratando?' :
          adiso.categoria === 'vehiculos' ? '¿Aún está en venta?' :
            '¿Sigue disponible?'
        }

${adisoUrl}

Ref: ${adiso.edicionNumero || adiso.id}`;

      // URL de WhatsApp con el mensaje predeterminado
      const whatsappUrl = `https://wa.me/51${adminWhatsApp}?text=${encodeURIComponent(mensaje)}`;

      // Registrar analytics si hay usuario
      if (user?.id) {
        registrarContacto(user.id, adiso.id, adiso.categoria);
      }

      // Abrir WhatsApp
      window.open(whatsappUrl, '_blank');
      return;
    }

    // Anuncio activo - contacto directo normal
    setContactosLocales(prev => prev + 1);
    registrarContacto(user?.id, adiso.id, adiso.categoria);

    // Determinar tipo de contacto y abrir según corresponda

    if (contactoEspecifico) {
      // Si es un contacto específico de contactosMultiples, verificar tipo
      const contactoObj = adiso.contactosMultiples?.find(c => c.valor === contactoEspecifico);
      if (contactoObj?.tipo === 'whatsapp' || contactoObj?.tipo === 'telefono') {
        window.open(getWhatsAppUrl(contactoAUsar, adiso.titulo, adiso.categoria, adiso.id), '_blank');
      } else if (contactoObj?.tipo === 'email') {
        window.location.href = `mailto:${contactoAUsar}?subject=Interesado en: ${encodeURIComponent(adiso.titulo)}`;
      } else {
        // Por defecto, intentar WhatsApp
        window.open(getWhatsAppUrl(contactoAUsar, adiso.titulo, adiso.categoria, adiso.id), '_blank');
      }
    } else {
      window.open(getWhatsAppUrl(contactoAUsar, adiso.titulo, adiso.categoria, adiso.id), '_blank');
    }
  };

  const handleEditar = () => {
    if (onEditar) {
      onEditar(adiso);
    }
  };

  const handleEliminarClick = () => {
    setMostrarConfirmarEliminar(true);
  };

  const handleConfirmarEliminar = async () => {
    if (!onEliminar) return;

    setEliminando(true);
    try {
      await onEliminar(adiso.id);
      setMostrarConfirmarEliminar(false);
      onCerrar(); // Cerrar el modal después de eliminar
    } catch (error) {
      console.error('Error al eliminar adiso:', error);
      setEliminando(false);
    }
  };

  const handleCancelarEliminar = () => {
    setMostrarConfirmarEliminar(false);
    setEliminando(false);
  };

  // --- RENDER LOGIC ---

  // Botones de acción (Links, Share, Fav) - Reutilizables
  // Botones de acción (Links, Share, Fav) - Reutilizables
  const ActionButtons = ({ mobile = false }) => (
    <div style={{ display: 'flex', gap: '8px' }}>
      <button
        onClick={handleCompartir}
        className="hover:scale-105 active:scale-95 transition-all"
        style={{
          width: '38px',
          height: '38px',
          borderRadius: '12px',
          border: 'none',
          backgroundColor: 'var(--bg-tertiary)',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 10px rgba(0,0,0,0.03)'
        }}
        title="Compartir"
      >
        <IconShare size={18} />
      </button>
      <button
        onClick={handleCopiarLink}
        className="hover:scale-105 active:scale-95 transition-all"
        style={{
          width: '38px',
          height: '38px',
          borderRadius: '12px',
          border: 'none',
          backgroundColor: copiado ? '#22c55e' : 'var(--bg-tertiary)',
          color: copiado ? 'white' : 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 10px rgba(0,0,0,0.03)'
        }}
        title="Copiar Link"
      >
        {copiado ? <IconCheck size={18} /> : <IconCopy size={18} />}
      </button>
      <button
        onClick={handleToggleFavorito}
        disabled={cargandoFavorito}
        className="hover:scale-105 active:scale-95 transition-all"
        style={{
          width: '38px',
          height: '38px',
          borderRadius: '12px',
          border: 'none',
          backgroundColor: 'var(--bg-tertiary)',
          color: esFavoritoState ? '#fbbf24' : 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 10px rgba(0,0,0,0.03)'
        }}
        title="Guardar en favoritos"
      >
        {cargandoFavorito ? (
          <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid var(--text-tertiary)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
        ) : (
          esFavoritoState ? <span style={{ fontSize: '1.2rem' }}>⭐</span> : <span style={{ fontSize: '1.2rem' }}>☆</span>
        )}
      </button>
    </div>
  );

  // Botón Principal de Contacto - Reutilizable
  const ContactButton = ({ fullWidth = false }) => {
    // Lógica para determinar el botón de contacto
    const contactosMultiples = adiso.contactosMultiples && adiso.contactosMultiples.length > 0
      ? adiso.contactosMultiples
      : null;

    const ahora = new Date();
    const esHistorico = adiso.esHistorico === true;
    const estaCaducado =
      adiso.estaActivo === false ||
      esHistorico ||
      (adiso.fechaExpiracion && new Date(adiso.fechaExpiracion) < ahora);

    const baseButtonStyle: React.CSSProperties = {
      width: fullWidth ? '100%' : 'auto',
      padding: '1rem 2rem',
      fontSize: '1.05rem',
      fontWeight: 800,
      color: 'white',
      border: 'none',
      borderRadius: '16px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.75rem',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: '0 10px 25px -5px rgba(56, 189, 248, 0.4)',
      textTransform: 'none'
    };

    if (estaCaducado || esHistorico) {
      return (
        <button
          onClick={() => handleContactar()}
          className="hover:-translate-y-1 hover:brightness-110 active:scale-[0.98]"
          style={{
            ...baseButtonStyle,
            backgroundColor: 'var(--brand-blue)',
            backgroundImage: 'linear-gradient(135deg, var(--brand-blue) 0%, #2563eb 100%)'
          }}
        >
          <IconWhatsApp size={22} /> Consultar disponibilidad
        </button>
      )
    }

    if (contactosMultiples && contactosMultiples.length > 1) {
      const contactoPrincipal = contactosMultiples[0];
      const isWA = contactoPrincipal.tipo === 'whatsapp';
      return (
        <button
          onClick={() => handleContactar(contactoPrincipal.valor)}
          className="hover:-translate-y-1 hover:brightness-110 active:scale-[0.98]"
          style={{
            ...baseButtonStyle,
            backgroundColor: isWA ? '#22c55e' : '#3b82f6',
            backgroundImage: isWA
              ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
              : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            boxShadow: isWA
              ? '0 10px 25px -5px rgba(34, 197, 94, 0.4)'
              : '0 10px 25px -5px rgba(59, 130, 246, 0.4)'
          }}
        >
          {isWA ? <IconWhatsApp size={22} /> : '✉️'}
          {contactoPrincipal.etiqueta || 'Contactar ahora'}
        </button>
      );
    }

    return (
      <button
        onClick={() => handleContactar()}
        className="hover:-translate-y-1 hover:brightness-110 active:scale-[0.98]"
        style={{
          ...baseButtonStyle,
          backgroundColor: '#22c55e',
          backgroundImage: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
          boxShadow: '0 10px 25px -5px rgba(34, 197, 94, 0.4)'
        }}
      >
        <IconWhatsApp size={22} />
        Contactar por WhatsApp
      </button>
    );
  };

  const ContentBody = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Vendedor Info Header within content */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: '46px', height: '46px', borderRadius: '14px', overflow: 'hidden',
            boxShadow: '0 8px 16px rgba(0,0,0,0.06)', position: 'relative',
            backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)'
          }}>
            {adiso.vendedor?.avatarUrl ? (
              <Image src={adiso.vendedor.avatarUrl} alt={adiso.vendedor.nombre} fill style={{ objectFit: 'cover' }} />
            ) : (
              <div
                className={`w-full h-full bg-gradient-to-br ${theme.iconBg} flex items-center justify-center text-white`}
              >
                {(() => { const Icon = getCategoriaIcon(adiso.categoria); return <Icon size={22} />; })()}
              </div>
            )}
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Publicado por</div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{adiso.vendedor?.nombre || 'Anunciante'}</div>
          </div>
        </div>
      </div>

      {/* Título */}
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.2, color: 'var(--text-primary)' }}>
        {adiso.titulo}
      </h2>

      {/* Imágenes */}
      {(() => {
        const imagenes = adiso.imagenesUrls && adiso.imagenesUrls.length > 0 ? adiso.imagenesUrls : adiso.imagenUrl ? [adiso.imagenUrl] : [];
        if (imagenes.length === 0) return null;
        return (
          <div style={{
            display: 'grid',
            gridTemplateColumns: imagenes.length === 1 ? '1fr' : 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: '12px',
            borderRadius: '24px',
            overflow: 'hidden'
          }}>
            {imagenes.map((url, idx) => (
              <div key={idx}
                onClick={() => setImagenAmpliada({ url, index: idx })}
                style={{
                  aspectRatio: '1',
                  position: 'relative',
                  cursor: 'zoom-in',
                  height: imagenes.length === 1 ? '300px' : 'auto'
                }}>
                <Image src={url} alt={`Imagen ${idx}`} fill style={{ objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        );
      })()}

      {/* Detalles e Info (Premium Card) */}
      <div style={{
        padding: '1.5rem',
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '24px',
        gap: '12px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
        border: '1px solid var(--border-subtle)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle background accent */}
        <div style={{
          position: 'absolute',
          top: 0, right: 0, width: '100px', height: '100px',
          background: `radial-gradient(circle at top right, ${theme.color}15, transparent 70%)`,
          pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ color: theme.color }}><IconLocation size={20} /></div>
          <span style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 600 }}>{formatearUbicacion(adiso.ubicacion).texto}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ color: theme.color }}><IconCalendar size={20} /></div>
          <span style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 500 }}>{formatFecha(adiso.fechaPublicacion, adiso.horaPublicacion)}</span>
        </div>

        <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)', margin: '4px 0' }} />

        <div style={{ display: 'flex', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ opacity: 0.7 }}>👁️</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{vistasLocales} Vistas</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ opacity: 0.7 }}>💬</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{contactosLocales} Interesados</span>
          </div>
        </div>
      </div>

      {/* Descripción */}
      <div style={{ fontSize: '1rem', lineHeight: 1.6, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
        {adiso.descripcion}
      </div>
    </div >
  );

  // --- MOBILE SHEET VIEW ---
  if (!isDesktop && !dentroSidebar) {
    return (
      <>
        <AnimatePresence>
          <div style={{ position: 'fixed', inset: 0, zIndex: 2000 }}>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }}
              onClick={onCerrar}
            />

            {/* Sheet */}
            <motion.div
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.2}
              onDragEnd={(e, { offset, velocity }) => {
                if (offset.y > 100 || velocity.y > 500) {
                  onCerrar();
                }
              }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300, mass: 0.8 }}
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '92vh',
                backgroundColor: 'var(--bg-primary)',
                borderRadius: '24px 24px 0 0',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 -10px 40px rgba(0,0,0,0.2)',
                overflow: 'hidden'
              }}
            >
              {/* Header Fixed */}
              <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                backgroundColor: 'var(--bg-primary)',
                zIndex: 10
              }}>
                {/* Handle */}
                <div style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '4px 0' }}>
                  <div style={{ width: '40px', height: '4px', borderRadius: '4px', backgroundColor: 'var(--border-color)' }} />
                </div>

                {/* Top Actions Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    color: 'var(--brand-blue)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    backgroundColor: 'rgba(56, 189, 248, 0.1)',
                    padding: '4px 12px',
                    borderRadius: '20px'
                  }}>
                    Detalle de Adiso
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ActionButtons mobile={true} />
                    <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)', margin: '0 4px' }} />
                    <button
                      onClick={onCerrar}
                      style={{
                        width: '40px', height: '40px', borderRadius: '50%', border: 'none',
                        backgroundColor: '#f3f4f6', color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <IconClose size={20} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Scrollable Content */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px', paddingBottom: '32px' }}>
                <ContentBody />
              </div>

              {/* Sticky Footer CTA */}
              <div style={{
                padding: '16px',
                borderTop: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-primary)',
                boxShadow: '0 -4px 12px rgba(0,0,0,0.05)',
                zIndex: 20
              }}>
                <ContactButton fullWidth={true} />
              </div>
            </motion.div>
          </div>
        </AnimatePresence>

        {/* Image Viewer Component (Standalone) */}
        {imagenAmpliada && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 3000, backgroundColor: 'black', display: 'flex', justifyContent: 'center', alignItems: 'center' }} onClick={() => setImagenAmpliada(null)}>
            <button onClick={() => setImagenAmpliada(null)} style={{ position: 'absolute', top: '20px', right: '20px', color: 'white', background: 'none', border: 'none', zIndex: 3001 }}>
              <IconClose size={32} />
            </button>
            <img src={imagenAmpliada.url} alt="Full screen" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          </div>
        )}
      </>
    );
  }

  // --- DESKTOP MODAL VIEW (OR SIDEBAR VIEW) ---
  const isSidebar = dentroSidebar;

  return (
    <>
      <div
        ref={modalRef}
        style={{
          // Desktop Overlay or Sidebar Container logic
          position: isSidebar ? 'relative' : 'fixed',
          inset: isSidebar ? 'auto' : 0,
          zIndex: isSidebar ? 'auto' : 1500,
          backgroundColor: isSidebar ? 'transparent' : 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'flex-end',
          pointerEvents: 'auto'
        }}
        onClick={(e) => {
          if (!isSidebar && e.target === e.currentTarget) onCerrar();
        }}
      >
        <div style={{
          width: isSidebar ? '100%' : '480px',
          maxWidth: '100%',
          height: '100%',
          backgroundColor: 'var(--bg-primary)',
          boxShadow: isSidebar ? 'none' : '-10px 0 40px rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative'
        }} onClick={e => e.stopPropagation()}>

          {/* Desktop Header */}
          <div style={{
            padding: '1.5rem',
            borderBottom: 'none',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
            backgroundColor: 'var(--bg-primary)'
          }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>Detalle de Adiso</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ActionButtons />
              {!isSidebar && (
                <button onClick={onCerrar} style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: 'var(--bg-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconClose />
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
            <ContentBody />
          </div>

          {/* Footer */}
          <div style={{
            padding: '1.5rem',
            borderTop: 'none',
            backgroundColor: 'var(--bg-primary)'
          }}>
            <ContactButton fullWidth={true} />
          </div>
        </div>
      </div>

      {/* Image Viewer Global */}
      {imagenAmpliada && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 3000, backgroundColor: 'rgba(0,0,0,0.95)', display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(10px)' }} onClick={() => setImagenAmpliada(null)}>
          <button onClick={() => setImagenAmpliada(null)} style={{ position: 'absolute', top: '2rem', right: '2rem', color: 'white', background: 'rgba(255,255,255,0.2)', border: 'none', width: '48px', height: '48px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconClose size={24} />
          </button>
          <img src={imagenAmpliada.url} alt="Full screen" style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }} />
        </div>
      )}
    </>
  );
}
