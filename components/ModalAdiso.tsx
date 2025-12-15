'use client';

import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
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
  onAnterior: () => void;
  onSiguiente: () => void;
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

  // Registrar visualización del adiso
  useEffect(() => {
    if (user?.id) {
      registrarVisualizacion(user.id, adiso.id);
    }
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

  const getCategoriaIcon = (categoria: Categoria): React.ComponentType<{ size?: number; color?: string }> => {
    const iconMap: Record<Categoria, React.ComponentType<{ size?: number; color?: string }>> = {
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
    // Si estamos en modo visualización dentro de la página (no standalone)
    if (adiso) {
      const seoUrl = getAdisoUrl(adiso);
      // Solo actualizar si es diferente para no llenar el historial
      if (typeof window !== 'undefined' && window.location.pathname !== seoUrl && !window.location.pathname.includes('/admin')) {
        window.history.replaceState(null, '', seoUrl);
      }
    }
  }, [adiso]);

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
      } else if (e.key === 'ArrowLeft' && puedeAnterior) {
        onAnterior();
      } else if (e.key === 'ArrowRight' && puedeSiguiente) {
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

    if (isLeftSwipe && puedeSiguiente) {
      onSiguiente();
    } else if (isRightSwipe && puedeAnterior) {
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

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    left: isDesktop ? 'auto' : 0,
    width: isDesktop ? '420px' : '100%',
    backgroundColor: isDesktop ? 'transparent' : 'rgba(0, 0, 0, 0.3)',
    zIndex: 1500,
    display: 'flex',
    alignItems: isDesktop ? 'stretch' : 'flex-end',
    justifyContent: isDesktop ? 'flex-end' : 'center',
    pointerEvents: 'none'
  };

  const modalContentStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-primary)',
    borderRadius: isDesktop ? '0' : '16px 16px 0 0',
    padding: '2.5rem', // Increased from 1.5rem for more whitespace
    paddingBottom: (puedeAnterior || puedeSiguiente) ? '5rem' : '2.5rem',
    width: isDesktop ? '420px' : '100%',
    maxWidth: isDesktop ? '90vw' : '100%',
    maxHeight: isDesktop ? '100vh' : '85vh',
    overflowY: 'auto' as const,
    position: 'relative',
    boxShadow: isDesktop ? '-4px 0 20px var(--shadow)' : '0 -4px 20px var(--shadow)',
    // Usar borderTop, borderRight, borderBottom explícitamente para evitar conflicto con borderLeft
    borderTop: 'none',
    borderRight: 'none',
    borderBottom: 'none',
    ...(isDesktop && { borderLeft: '1px solid var(--border-color)' })
  };

  // Si está dentro del sidebar, no mostrar overlay
  if (dentroSidebar) {
    return (
      <>
        <div
          ref={modalRef}
          style={{
            ...modalContentStyle,
            width: '100%',
            maxWidth: '100%',
            height: 'auto',
            minHeight: '100%',
            padding: '1rem',
            paddingBottom: (puedeAnterior || puedeSiguiente) ? '5.5rem' : '1rem', // Espacio extra para botones de navegación
            borderRadius: 0,
            boxShadow: 'none',
            overflowY: 'visible', // Sin scroll propio, usa el del contenedor padre
            position: 'relative',
            // Usar borderTop, borderRight, borderBottom, borderLeft explícitamente para evitar conflicto
            borderTop: 'none',
            borderRight: 'none',
            borderBottom: 'none',
            borderLeft: 'none'
          }}
        >
          {/* No mostrar botón de cerrar cuando está dentro del sidebar (desktop o mobile) */}
          {/* En desktop: el usuario puede colapsar el sidebar o cambiar de sección */}
          {/* En mobile: ya hay un botón de cerrar en el header del ModalNavegacionMobile */}

          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-tertiary)',
                  textTransform: 'capitalize',
                  marginBottom: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                {(() => {
                  const IconComponent = getCategoriaIcon(adiso.categoria);
                  return <IconComponent size={14} />;
                })()}
                {adiso.categoria}
              </div>

              {/* Expand Button */}
              <button
                onClick={() => {
                  window.location.href = getAdisoUrl(adiso);
                }}
                style={{
                  padding: '0.5rem',
                  borderRadius: '50%',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  marginTop: '-0.25rem'
                }}
                title="Abrir en página completa"
                aria-label="Abrir en página completa"
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                <IconExternalLink size={14} />
              </button>
            </div>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: '1rem',
              lineHeight: 1.3
              // paddingRight removido ya que no hay botón de cerrar dentro del sidebar
            }}>
              {adiso.titulo}
            </h2>
            {(() => {
              // Mostrar todas las imágenes si hay múltiples, o imagen única
              const imagenes = adiso.imagenesUrls && adiso.imagenesUrls.length > 0
                ? adiso.imagenesUrls
                : adiso.imagenUrl
                  ? [adiso.imagenUrl]
                  : [];

              if (imagenes.length === 0) return null;

              return (
                <div style={{ marginBottom: '1rem' }}>
                  {imagenes.length === 1 ? (
                    // Una sola imagen: mostrar grande
                    <div
                      style={{
                        borderRadius: '8px',
                        overflow: 'hidden',
                        border: '1px solid var(--border-color)',
                        position: 'relative',
                        width: '100%',
                        height: '400px',
                        cursor: 'pointer',
                      }}
                      onClick={() => setImagenAmpliada({ url: imagenes[0], index: 0 })}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setImagenAmpliada({ url: imagenes[0], index: 0 });
                        }
                      }}
                      aria-label="Ampliar imagen"
                    >
                      <Image
                        src={imagenes[0]}
                        alt={adiso.titulo}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        style={{
                          objectFit: 'cover',
                          transition: 'opacity 0.2s'
                        }}
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    // Múltiples imágenes: mostrar en grid
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: imagenes.length === 2 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
                      gap: '0.5rem',
                      borderRadius: '8px',
                      overflow: 'hidden'
                    }}>
                      {imagenes.map((url, index) => (
                        <div
                          key={index}
                          style={{
                            aspectRatio: '1',
                            overflow: 'hidden',
                            border: '1px solid var(--border-color)',
                            borderRadius: '4px',
                            position: 'relative',
                            cursor: 'pointer'
                          }}
                          onClick={() => setImagenAmpliada({ url, index })}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setImagenAmpliada({ url, index });
                            }
                          }}
                          aria-label={`Ampliar imagen ${index + 1} de ${imagenes.length}`}
                        >
                          <Image
                            src={url}
                            alt={`${adiso.titulo} - Imagen ${index + 1}`}
                            fill
                            sizes="(max-width: 768px) 33vw, 20vw"
                            style={{
                              objectFit: 'cover',
                              transition: 'opacity 0.2s'
                            }}
                            loading={index < 3 ? 'eager' : 'lazy'}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
            <div style={{
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              marginBottom: '1rem',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap'
            }}>
              {adiso.descripcion}
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                marginBottom: '1.5rem',
                paddingTop: '1rem',
                borderTop: '1px solid var(--border-color)'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <IconLocation aria-hidden="true" />
                <span>
                  <strong style={{ color: 'var(--text-primary)' }}>Ubicación:</strong> {formatearUbicacion(adiso.ubicacion).texto}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <IconCalendar aria-hidden="true" />
                <span>
                  <strong style={{ color: 'var(--text-primary)' }}>Publicado:</strong>{' '}
                  {formatFecha(adiso.fechaPublicacion, adiso.horaPublicacion)}
                </span>
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            {/* Botones de contacto - múltiples o único */}
            {(() => {
              const contactosMultiples = adiso.contactosMultiples && adiso.contactosMultiples.length > 0
                ? adiso.contactosMultiples
                : null;

              // Verificar si está caducado o es histórico
              const ahora = new Date();
              const esHistorico = adiso.esHistorico === true;
              const estaCaducado =
                adiso.estaActivo === false ||
                esHistorico ||
                (adiso.fechaExpiracion && new Date(adiso.fechaExpiracion) < ahora);

              if (contactosMultiples && contactosMultiples.length > 1) {
                // Múltiples contactos
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {contactosMultiples.map((contacto, index) => (
                      <button
                        key={index}
                        onClick={() => handleContactar(contacto.valor)}
                        aria-label={`Contactar por ${contacto.tipo}`}
                        style={{
                          width: '100%',
                          padding: '0.875rem',
                          fontSize: '0.9rem',
                          fontWeight: 600,
                          backgroundColor: contacto.tipo === 'whatsapp' ? '#25D366' : contacto.tipo === 'email' ? '#3b82f6' : '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'opacity 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = '0.9';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = '1';
                        }}
                      >
                        {contacto.tipo === 'whatsapp' && <IconWhatsApp aria-hidden="true" />}
                        {contacto.tipo === 'email' && '✉️'}
                        {contacto.tipo === 'telefono' && '📞'}
                        {contacto.etiqueta || `Contactar por ${contacto.tipo}`}
                      </button>
                    ))}
                  </div>
                );
              } else {
                // Contacto único
                return (
                  <button
                    onClick={() => handleContactar()}
                    aria-label={`Contactar al publicador de ${adiso.titulo} por WhatsApp`}
                    style={{
                      width: '100%',
                      padding: '0.875rem',
                      fontSize: '1rem',
                      fontWeight: 600,
                      backgroundColor: '#25D366',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'opacity 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '0.9';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '1';
                    }}
                  >
                    <IconWhatsApp aria-hidden="true" />
                    Contactar por WhatsApp
                  </button>
                );
              }
            })()}

            {/* Botones de acción y navegación en la misma línea */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              width: '100%'
            }}>
              {/* Flecha izquierda */}
              {(puedeAnterior || puedeSiguiente) && (
                <button
                  onClick={onAnterior}
                  disabled={!puedeAnterior}
                  style={{
                    padding: '0.75rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '50%',
                    backgroundColor: puedeAnterior ? 'var(--bg-primary)' : 'var(--bg-secondary)',
                    color: puedeAnterior ? 'var(--text-primary)' : 'var(--text-tertiary)',
                    cursor: puedeAnterior ? 'pointer' : 'not-allowed',
                    opacity: puedeAnterior ? 1 : 0.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '44px',
                    height: '44px',
                    flexShrink: 0,
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (puedeAnterior) {
                      e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (puedeAnterior) {
                      e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
                    }
                  }}
                >
                  <IconArrowLeft aria-hidden="true" />
                </button>
              )}

              {/* Botones de acción centrados */}
              <div style={{
                display: 'flex',
                gap: '0.5rem',
                flex: 1,
                justifyContent: 'center'
              }}>
                <button
                  onClick={handleCopiarLink}
                  style={{
                    padding: '0.75rem 1rem',
                    fontSize: '0.875rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
                  }}
                >
                  {copiado ? <IconCheck aria-hidden="true" /> : <IconCopy aria-hidden="true" />}
                  {copiado ? 'Copiado' : 'Copiar link'}
                </button>
                <button
                  onClick={handleCompartir}
                  style={{
                    padding: '0.75rem 1rem',
                    fontSize: '0.875rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
                  }}
                >
                  <IconShare aria-hidden="true" />
                  Compartir
                </button>
                {user && (
                  <button
                    onClick={handleToggleFavorito}
                    disabled={cargandoFavorito}
                    style={{
                      padding: '0.75rem 1rem',
                      fontSize: '0.875rem',
                      border: `1px solid ${esFavoritoState ? '#fbbf24' : 'var(--border-color)'}`,
                      borderRadius: '8px',
                      backgroundColor: esFavoritoState ? 'rgba(251, 191, 36, 0.2)' : 'var(--bg-primary)',
                      color: esFavoritoState ? '#fbbf24' : 'var(--text-primary)',
                      cursor: cargandoFavorito ? 'not-allowed' : 'pointer',
                      transition: 'background-color 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      whiteSpace: 'nowrap',
                      opacity: cargandoFavorito ? 0.6 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!cargandoFavorito) {
                        e.currentTarget.style.backgroundColor = esFavoritoState ? 'rgba(251, 191, 36, 0.3)' : 'var(--hover-bg)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!cargandoFavorito) {
                        e.currentTarget.style.backgroundColor = esFavoritoState ? 'rgba(251, 191, 36, 0.2)' : 'var(--bg-primary)';
                      }
                    }}
                  >
                    {cargandoFavorito ? '...' : esFavoritoState ? '⭐' : '☆'}
                    {esFavoritoState ? 'Favorito' : 'Favorito'}
                  </button>
                )}
              </div>

              {/* Flecha derecha */}
              {(puedeAnterior || puedeSiguiente) && (
                <button
                  onClick={onSiguiente}
                  disabled={!puedeSiguiente}
                  style={{
                    padding: '0.75rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '50%',
                    backgroundColor: puedeSiguiente ? 'var(--bg-primary)' : 'var(--bg-secondary)',
                    color: puedeSiguiente ? 'var(--text-primary)' : 'var(--text-tertiary)',
                    cursor: puedeSiguiente ? 'pointer' : 'not-allowed',
                    opacity: puedeSiguiente ? 1 : 0.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '44px',
                    height: '44px',
                    flexShrink: 0,
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (puedeSiguiente) {
                      e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (puedeSiguiente) {
                      e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
                    }
                  }}
                >
                  <IconArrowRight />
                </button>
              )}
            </div>
          </div>

          {/* Modal de imagen ampliada - fuera del modal principal para evitar conflictos */}
          {imagenAmpliada && (() => {
            const imagenes = adiso.imagenesUrls && adiso.imagenesUrls.length > 0
              ? adiso.imagenesUrls
              : adiso.imagenUrl ? [adiso.imagenUrl] : [];
            const puedeAnteriorImg = imagenAmpliada.index > 0;
            const puedeSiguienteImg = imagenAmpliada.index < imagenes.length - 1;

            return (
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.95)',
                  zIndex: 3000,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '2rem',
                  cursor: 'pointer'
                }}
                onClick={(e) => {
                  // Solo cerrar si se hace click directamente en el fondo (no en el contenido)
                  if (e.target === e.currentTarget) {
                    setImagenAmpliada(null);
                  }
                }}
              >
                <div
                  style={{
                    position: 'relative',
                    maxWidth: '90vw',
                    maxHeight: '90vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setImagenAmpliada(null);
                    }}
                    style={{
                      position: 'absolute',
                      top: '-3rem',
                      right: 0,
                      background: 'rgba(255, 255, 255, 0.2)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '40px',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: 'white',
                      fontSize: '1.5rem',
                      zIndex: 10,
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                    }}
                  >
                    <IconClose aria-hidden="true" />
                  </button>

                  {puedeAnteriorImg && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setImagenAmpliada({ url: imagenes[imagenAmpliada.index - 1], index: imagenAmpliada.index - 1 });
                      }}
                      style={{
                        position: 'absolute',
                        left: isDesktop ? '-3rem' : '-1rem',
                        background: 'rgba(255, 255, 255, 0.2)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '50px',
                        height: '50px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: 'white',
                        zIndex: 10,
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                      }}
                    >
                      <IconArrowLeft size={24} />
                    </button>
                  )}

                  <img
                    src={imagenAmpliada.url}
                    alt={`${adiso.titulo} - Imagen ${imagenAmpliada.index + 1}`}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '90vh',
                      objectFit: 'contain',
                      borderRadius: '8px',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                      cursor: 'default'
                    }}
                  />

                  {puedeSiguienteImg && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setImagenAmpliada({ url: imagenes[imagenAmpliada.index + 1], index: imagenAmpliada.index + 1 });
                      }}
                      style={{
                        position: 'absolute',
                        right: isDesktop ? '-3rem' : '-1rem',
                        background: 'rgba(255, 255, 255, 0.2)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '50px',
                        height: '50px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: 'white',
                        zIndex: 10,
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                      }}
                    >
                      <IconArrowRight size={24} aria-hidden="true" />
                    </button>
                  )}

                  {imagenes.length > 1 && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '-3rem',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'rgba(255, 255, 255, 0.2)',
                        padding: '0.5rem 1rem',
                        borderRadius: '20px',
                        color: 'white',
                        fontSize: '0.875rem',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {imagenAmpliada.index + 1} / {imagenes.length}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      </>
    );
  }

  // Renderizado normal con overlay
  return (
    <>
      <div
        style={overlayStyle}
        onClick={isDesktop ? undefined : onCerrar}
      >
        <div
          ref={modalRef}
          style={{ ...modalContentStyle, pointerEvents: 'auto' }}
          onClick={(e) => e.stopPropagation()}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <button
            onClick={onCerrar}
            aria-label="Cerrar adiso"
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              background: 'none',
              border: 'none',
              padding: '0.5rem',
              lineHeight: 1,
              zIndex: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <IconClose aria-hidden="true" />
          </button>

          <div style={{ marginBottom: '1rem' }}>
            <div
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-tertiary)',
                textTransform: 'capitalize',
                marginBottom: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              {(() => {
                const IconComponent = getCategoriaIcon(adiso.categoria);
                return <IconComponent size={14} />;
              })()}
              {adiso.categoria}
            </div>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: '1rem',
              lineHeight: 1.3,
              paddingRight: '2.5rem'
            }}>
              {adiso.titulo}
            </h2>

            {/* Banner para anuncios históricos */}
            {adiso.esHistorico && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.875rem',
                  color: '#374151'
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>📜</span>
                <div style={{ flex: 1 }}>
                  <strong style={{ display: 'block', marginBottom: '0.25rem' }}>
                    Anuncio Histórico
                  </strong>
                  <span>
                    Este anuncio es de una edición antigua. Si te interesa, podemos notificar al anunciante para que pueda republicarlo oficialmente.
                  </span>
                </div>
              </div>
            )}

            {(() => {
              // Mostrar todas las imágenes si hay múltiples, o imagen única
              const imagenes = adiso.imagenesUrls && adiso.imagenesUrls.length > 0
                ? adiso.imagenesUrls
                : adiso.imagenUrl
                  ? [adiso.imagenUrl]
                  : [];

              if (imagenes.length === 0) return null;

              return (
                <div style={{ marginBottom: '1rem' }}>
                  {imagenes.length === 1 ? (
                    // Una sola imagen: mostrar grande
                    <div
                      style={{
                        borderRadius: '8px',
                        overflow: 'hidden',
                        border: '1px solid var(--border-color)',
                        position: 'relative',
                        width: '100%',
                        height: '400px',
                        cursor: 'pointer',
                      }}
                      onClick={() => setImagenAmpliada({ url: imagenes[0], index: 0 })}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setImagenAmpliada({ url: imagenes[0], index: 0 });
                        }
                      }}
                      aria-label="Ampliar imagen"
                    >
                      <Image
                        src={imagenes[0]}
                        alt={adiso.titulo}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        style={{
                          objectFit: 'cover',
                          transition: 'opacity 0.2s'
                        }}
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    // Múltiples imágenes: mostrar en grid
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: imagenes.length === 2 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
                      gap: '0.5rem',
                      borderRadius: '8px',
                      overflow: 'hidden'
                    }}>
                      {imagenes.map((url, index) => (
                        <div
                          key={index}
                          style={{
                            aspectRatio: '1',
                            overflow: 'hidden',
                            border: '1px solid var(--border-color)',
                            borderRadius: '4px',
                            position: 'relative',
                            cursor: 'pointer'
                          }}
                          onClick={() => setImagenAmpliada({ url, index })}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setImagenAmpliada({ url, index });
                            }
                          }}
                          aria-label={`Ampliar imagen ${index + 1} de ${imagenes.length}`}
                        >
                          <Image
                            src={url}
                            alt={`${adiso.titulo} - Imagen ${index + 1}`}
                            fill
                            sizes="(max-width: 768px) 33vw, 20vw"
                            style={{
                              objectFit: 'cover',
                              transition: 'opacity 0.2s'
                            }}
                            loading={index < 3 ? 'eager' : 'lazy'}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
            <div style={{
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              marginBottom: '1rem',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap'
            }}>
              {adiso.descripcion}
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                marginBottom: '1.5rem',
                paddingTop: '1rem',
                borderTop: '1px solid var(--border-color)'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <IconLocation aria-hidden="true" />
                <span>
                  <strong style={{ color: 'var(--text-primary)' }}>Ubicación:</strong> {formatearUbicacion(adiso.ubicacion).texto}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <IconCalendar aria-hidden="true" />
                <span>
                  <strong style={{ color: 'var(--text-primary)' }}>Publicado:</strong>{' '}
                  {formatFecha(adiso.fechaPublicacion, adiso.horaPublicacion)}
                </span>
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            {/* Botones de contacto - múltiples o único */}
            {(() => {
              const contactosMultiples = adiso.contactosMultiples && adiso.contactosMultiples.length > 0
                ? adiso.contactosMultiples
                : null;

              // Verificar si está caducado o es histórico
              const ahora = new Date();
              const esHistorico = adiso.esHistorico === true;
              const estaCaducado =
                adiso.estaActivo === false ||
                esHistorico ||
                (adiso.fechaExpiracion && new Date(adiso.fechaExpiracion) < ahora);

              if (contactosMultiples && contactosMultiples.length > 1) {
                // Múltiples contactos
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {contactosMultiples.map((contacto, index) => (
                      <button
                        key={index}
                        onClick={() => handleContactar(contacto.valor)}
                        aria-label={`Contactar por ${contacto.tipo}`}
                        style={{
                          width: '100%',
                          padding: '0.875rem',
                          fontSize: '0.9rem',
                          fontWeight: 600,
                          backgroundColor: contacto.tipo === 'whatsapp' ? '#25D366' : contacto.tipo === 'email' ? '#3b82f6' : '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'opacity 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = '0.9';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = '1';
                        }}
                      >
                        {contacto.tipo === 'whatsapp' && <IconWhatsApp aria-hidden="true" />}
                        {contacto.tipo === 'email' && '✉️'}
                        {contacto.tipo === 'telefono' && '📞'}
                        {contacto.etiqueta || `Contactar por ${contacto.tipo}`}
                      </button>
                    ))}
                  </div>
                );
              } else {
                // Contacto único
                return (
                  <button
                    onClick={() => handleContactar()}
                    aria-label={`Contactar al publicador de ${adiso.titulo} por WhatsApp`}
                    style={{
                      width: '100%',
                      padding: '0.875rem',
                      fontSize: '1rem',
                      fontWeight: 600,
                      backgroundColor: '#25D366',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'opacity 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '0.9';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '1';
                    }}
                  >
                    <IconWhatsApp aria-hidden="true" />
                    Contactar por WhatsApp
                  </button>
                );
              }
            })()}

            {/* Botones de acción y navegación en la misma línea */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              width: '100%'
            }}>
              {/* Flecha izquierda */}
              {(puedeAnterior || puedeSiguiente) && (
                <button
                  onClick={onAnterior}
                  disabled={!puedeAnterior}
                  style={{
                    padding: '0.75rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '50%',
                    backgroundColor: puedeAnterior ? 'var(--bg-primary)' : 'var(--bg-secondary)',
                    color: puedeAnterior ? 'var(--text-primary)' : 'var(--text-tertiary)',
                    cursor: puedeAnterior ? 'pointer' : 'not-allowed',
                    opacity: puedeAnterior ? 1 : 0.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '44px',
                    height: '44px',
                    flexShrink: 0,
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (puedeAnterior) {
                      e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (puedeAnterior) {
                      e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
                    }
                  }}
                >
                  <IconArrowLeft aria-hidden="true" />
                </button>
              )}

              {/* Botones de acción centrados */}
              <div style={{
                display: 'flex',
                gap: '0.5rem',
                flex: 1,
                justifyContent: 'center'
              }}>
                <button
                  onClick={handleCopiarLink}
                  style={{
                    padding: '0.75rem 1rem',
                    fontSize: '0.875rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
                  }}
                >
                  {copiado ? <IconCheck aria-hidden="true" /> : <IconCopy aria-hidden="true" />}
                  {copiado ? 'Copiado' : 'Copiar link'}
                </button>
                <button
                  onClick={handleCompartir}
                  style={{
                    padding: '0.75rem 1rem',
                    fontSize: '0.875rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
                  }}
                >
                  <IconShare aria-hidden="true" />
                  Compartir
                </button>
                {user && (
                  <button
                    onClick={handleToggleFavorito}
                    disabled={cargandoFavorito}
                    style={{
                      padding: '0.75rem 1rem',
                      fontSize: '0.875rem',
                      border: `1px solid ${esFavoritoState ? '#fbbf24' : 'var(--border-color)'}`,
                      borderRadius: '8px',
                      backgroundColor: esFavoritoState ? 'rgba(251, 191, 36, 0.2)' : 'var(--bg-primary)',
                      color: esFavoritoState ? '#fbbf24' : 'var(--text-primary)',
                      cursor: cargandoFavorito ? 'not-allowed' : 'pointer',
                      transition: 'background-color 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      whiteSpace: 'nowrap',
                      opacity: cargandoFavorito ? 0.6 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!cargandoFavorito) {
                        e.currentTarget.style.backgroundColor = esFavoritoState ? 'rgba(251, 191, 36, 0.3)' : 'var(--hover-bg)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!cargandoFavorito) {
                        e.currentTarget.style.backgroundColor = esFavoritoState ? 'rgba(251, 191, 36, 0.2)' : 'var(--bg-primary)';
                      }
                    }}
                  >
                    {cargandoFavorito ? '...' : esFavoritoState ? '⭐' : '☆'}
                    {esFavoritoState ? 'Favorito' : 'Favorito'}
                  </button>
                )}
              </div>

              {/* Flecha derecha */}
              {(puedeAnterior || puedeSiguiente) && (
                <button
                  onClick={onSiguiente}
                  disabled={!puedeSiguiente}
                  style={{
                    padding: '0.75rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '50%',
                    backgroundColor: puedeSiguiente ? 'var(--bg-primary)' : 'var(--bg-secondary)',
                    color: puedeSiguiente ? 'var(--text-primary)' : 'var(--text-tertiary)',
                    cursor: puedeSiguiente ? 'pointer' : 'not-allowed',
                    opacity: puedeSiguiente ? 1 : 0.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '44px',
                    height: '44px',
                    flexShrink: 0,
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (puedeSiguiente) {
                      e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (puedeSiguiente) {
                      e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
                    }
                  }}
                >
                  <IconArrowRight />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de imagen ampliada - fuera del modal principal para evitar conflictos */}
      {imagenAmpliada && (() => {
        const imagenes = adiso.imagenesUrls && adiso.imagenesUrls.length > 0
          ? adiso.imagenesUrls
          : adiso.imagenUrl ? [adiso.imagenUrl] : [];
        const puedeAnteriorImg = imagenAmpliada.index > 0;
        const puedeSiguienteImg = imagenAmpliada.index < imagenes.length - 1;

        return (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.95)',
              zIndex: 3000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2rem',
              cursor: 'pointer'
            }}
            onClick={(e) => {
              // Solo cerrar si se hace click directamente en el fondo (no en el contenido)
              if (e.target === e.currentTarget) {
                setImagenAmpliada(null);
              }
            }}
          >
            <div
              style={{
                position: 'relative',
                maxWidth: '90vw',
                maxHeight: '90vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setImagenAmpliada(null);
                }}
                style={{
                  position: 'absolute',
                  top: '-3rem',
                  right: 0,
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'white',
                  fontSize: '1.5rem',
                  zIndex: 10,
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                }}
              >
                <IconClose aria-hidden="true" />
              </button>

              {puedeAnteriorImg && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setImagenAmpliada({ url: imagenes[imagenAmpliada.index - 1], index: imagenAmpliada.index - 1 });
                  }}
                  style={{
                    position: 'absolute',
                    left: isDesktop ? '-3rem' : '-1rem',
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '50px',
                    height: '50px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'white',
                    zIndex: 10,
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                  }}
                >
                  <IconArrowLeft size={24} />
                </button>
              )}

              <img
                src={imagenAmpliada.url}
                alt={`${adiso.titulo} - Imagen ${imagenAmpliada.index + 1}`}
                onClick={(e) => e.stopPropagation()}
                style={{
                  maxWidth: '100%',
                  maxHeight: '90vh',
                  objectFit: 'contain',
                  borderRadius: '8px',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                  cursor: 'default'
                }}
              />

              {puedeSiguienteImg && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setImagenAmpliada({ url: imagenes[imagenAmpliada.index + 1], index: imagenAmpliada.index + 1 });
                  }}
                  style={{
                    position: 'absolute',
                    right: isDesktop ? '-3rem' : '-1rem',
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '50px',
                    height: '50px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'white',
                    zIndex: 10,
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                  }}
                >
                  <IconArrowRight size={24} aria-hidden="true" />
                </button>
              )}

              {imagenes.length > 1 && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '-3rem',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(255, 255, 255, 0.2)',
                    padding: '0.5rem 1rem',
                    borderRadius: '20px',
                    color: 'white',
                    fontSize: '0.875rem',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {imagenAmpliada.index + 1} / {imagenes.length}
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </>
  );
}
