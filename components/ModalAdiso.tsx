'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Adiso } from '@/types';
import { formatFecha, getWhatsAppUrl, copiarLink, compartirNativo } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/useMediaQuery';
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
  IconComunidad
} from './Icons';
import { Categoria } from '@/types';

interface ModalAdisoProps {
  adiso: Adiso;
  onCerrar: () => void;
  onAnterior: () => void;
  onSiguiente: () => void;
  puedeAnterior: boolean;
  puedeSiguiente: boolean;
  dentroSidebar?: boolean; // Indica si está dentro del sidebar (sin overlay)
}

export default function ModalAdiso({
  adiso,
  onCerrar,
  onAnterior,
  onSiguiente,
  puedeAnterior,
  puedeSiguiente,
  dentroSidebar = false
}: ModalAdisoProps) {
  const [copiado, setCopiado] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [imagenAmpliada, setImagenAmpliada] = useState<{ url: string; index: number } | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const minSwipeDistance = 50;

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

    const handleContactar = () => {
      window.open(getWhatsAppUrl(adiso.contacto, adiso.titulo, adiso.categoria, adiso.id), '_blank');
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
    padding: '1.5rem',
    paddingBottom: (puedeAnterior || puedeSiguiente) ? '5rem' : '1.5rem',
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
                  <div style={{
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '1px solid var(--border-color)'
                  }}>
                    <img
                      src={imagenes[0]}
                      alt={adiso.titulo}
                      onClick={() => setImagenAmpliada({ url: imagenes[0], index: 0 })}
                      style={{
                        width: '100%',
                        maxHeight: '400px',
                        objectFit: 'cover',
                        display: 'block',
                        cursor: 'pointer',
                        transition: 'opacity 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = '0.9';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = '1';
                      }}
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
                          borderRadius: '4px'
                        }}
                      >
                        <img
                          src={url}
                          alt={`${adiso.titulo} - Imagen ${index + 1}`}
                          onClick={() => setImagenAmpliada({ url, index })}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block',
                            cursor: 'pointer',
                            transition: 'opacity 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.opacity = '0.9';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.opacity = '1';
                          }}
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
              <IconLocation />
              <span>
                <strong style={{ color: 'var(--text-primary)' }}>Ubicación:</strong> {adiso.ubicacion}
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <IconCalendar />
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
          <button
            onClick={handleContactar}
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
            <IconWhatsApp />
            Contactar por WhatsApp
          </button>
          
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
                <IconArrowLeft />
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
                {copiado ? <IconCheck /> : <IconCopy />}
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
                <IconShare />
                Compartir
              </button>
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
                <IconClose />
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
                  <IconArrowRight size={24} />
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
          <IconClose />
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
                  <div style={{
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '1px solid var(--border-color)'
                  }}>
                    <img
                      src={imagenes[0]}
                      alt={adiso.titulo}
                      onClick={() => setImagenAmpliada({ url: imagenes[0], index: 0 })}
                      style={{
                        width: '100%',
                        maxHeight: '400px',
                        objectFit: 'cover',
                        display: 'block',
                        cursor: 'pointer',
                        transition: 'opacity 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = '0.9';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = '1';
                      }}
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
                          borderRadius: '4px'
                        }}
                      >
                        <img
                          src={url}
                          alt={`${adiso.titulo} - Imagen ${index + 1}`}
                          onClick={() => setImagenAmpliada({ url, index })}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block',
                            cursor: 'pointer',
                            transition: 'opacity 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.opacity = '0.9';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.opacity = '1';
                          }}
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
              <IconLocation />
              <span>
                <strong style={{ color: 'var(--text-primary)' }}>Ubicación:</strong> {adiso.ubicacion}
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <IconCalendar />
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
          <button
            onClick={handleContactar}
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
            <IconWhatsApp />
            Contactar por WhatsApp
          </button>
          
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
                <IconArrowLeft />
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
                {copiado ? <IconCheck /> : <IconCopy />}
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
                <IconShare />
                Compartir
              </button>
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
                <IconClose />
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
                  <IconArrowRight size={24} />
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
