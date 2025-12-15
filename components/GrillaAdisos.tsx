'use client';

import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import { Adiso, Categoria, PAQUETES } from '@/types';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useAuth } from '@/hooks/useAuth';
import { registrarClick } from '@/lib/analytics';
import TrustBadge from './trust/TrustBadge';
import {
  IconEmpleos,
  IconInmuebles,
  IconVehiculos,
  IconServicios,
  IconProductos,
  IconEventos,
  IconNegocios,
  IconComunidad
} from './Icons';

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

interface GrillaAdisosProps {
  adisos: Adiso[];
  onAbrirAdiso: (adiso: Adiso) => void;
  adisoSeleccionadoId?: string | null;
  espacioAdicional?: number; // Espacio adicional disponible (píxeles) cuando el sidebar está minimizado
  cargandoMas?: boolean; // Indica si se están cargando más anuncios
  sentinelRef?: React.RefObject<HTMLDivElement>; // Ref para infinite scroll
}

export default function GrillaAdisos({ adisos, onAbrirAdiso, adisoSeleccionadoId, espacioAdicional = 0, cargandoMas = false, sentinelRef }: GrillaAdisosProps) {
  const adisoRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const { user } = useAuth();

  const handleClickAdiso = (adiso: Adiso) => {
    // Registrar click
    registrarClick(user?.id, adiso.id, adiso.categoria);
    onAbrirAdiso(adiso);
  };

  // Calcular número de columnas basado en el espacio disponible
  // En desktop, con sidebar expandido (420px): 4 columnas
  // En desktop, con sidebar minimizado (60px): más columnas (hasta 6-7)
  // En mobile: 2 columnas
  const getColumnas = () => {
    if (!isDesktop) return 2;

    // Si hay espacio adicional (sidebar minimizado), calcular más columnas
    // Estimamos ~180px por columna (incluyendo gaps y padding)
    const columnasBase = 4;
    const columnasAdicionales = Math.floor(espacioAdicional / 180);
    return Math.min(columnasBase + columnasAdicionales, 7); // Máximo 7 columnas
  };

  const columnas = getColumnas();

  // Scroll automático cuando cambia el adiso seleccionado
  useEffect(() => {
    if (adisoSeleccionadoId && adisoRefs.current[adisoSeleccionadoId]) {
      const elemento = adisoRefs.current[adisoSeleccionadoId];
      if (elemento) {
        // Esperar un poco para que el DOM se actualice
        setTimeout(() => {
          elemento.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          });
        }, 100);
      }
    }
  }, [adisoSeleccionadoId]);

  const getCategoriaColor = (categoria: Categoria) => {
    const colorMap: Record<Categoria, string> = {
      empleos: 'var(--cat-empleos)',
      inmuebles: 'var(--cat-inmuebles)',
      vehiculos: 'var(--cat-vehiculos)',
      servicios: 'var(--cat-servicios)',
      productos: 'var(--cat-productos)',
      eventos: 'var(--cat-eventos)',
      negocios: 'var(--cat-negocios)',
      comunidad: 'var(--cat-comunidad)',
    };
    return colorMap[categoria];
  };

  return (
    <>
      <style jsx>{`
        .grilla-adisos {
          display: grid;
          grid-template-columns: ${isDesktop
          ? 'repeat(auto-fit, minmax(220px, 1fr))'
          : 'repeat(2, 1fr)'};

          gap: ${isDesktop ? '1.5rem' : '1rem'};
          grid-auto-rows: minmax(${isDesktop ? '80px' : '80px'}, auto);
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
      <div className="grilla-adisos">
        {adisos.map((adiso) => {
          const estaSeleccionado = adiso.id === adisoSeleccionadoId;
          const tamaño = adiso.tamaño || 'miniatura';
          const paquete = PAQUETES[tamaño];

          // Calcular grid span según el tamaño
          const gridColumnSpan = paquete.columnas;
          const gridRowSpan = paquete.filas;

          return (
            <button
              key={adiso.id}
              ref={(el) => {
                adisoRefs.current[adiso.id] = el;
              }}
              onClick={() => handleClickAdiso(adiso)}
              aria-label={`Ver detalles del adiso: ${adiso.titulo} en ${adiso.categoria}`}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleClickAdiso(adiso);
                }
              }}
              style={{
                backgroundColor: estaSeleccionado ? 'var(--hover-bg)' : 'var(--bg-primary)',
                border: estaSeleccionado
                  ? '2px solid var(--accent-color)'
                  : '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: tamaño === 'miniatura'
                  ? isDesktop ? '1rem' : '0.75rem'
                  : tamaño === 'pequeño'
                    ? isDesktop ? '1.25rem' : '1rem'
                    : '1.5rem',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                flexDirection: 'column',
                gap: tamaño === 'miniatura'
                  ? '0.375rem'
                  : tamaño === 'pequeño'
                    ? '0.5rem'
                    : '0.625rem',
                position: 'relative',
                boxShadow: estaSeleccionado ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
                gridColumn: `span ${gridColumnSpan}`,
                gridRow: `span ${gridRowSpan}`,
                height: '100%',
                justifyContent: 'flex-start',
                overflow: 'hidden',
                minHeight: 0,
                outline: 'none',
              }}
              onFocus={(e) => {
                e.currentTarget.style.outline = '2px solid var(--text-primary)';
                e.currentTarget.style.outlineOffset = '2px';
              }}
              onBlur={(e) => {
                if (!estaSeleccionado) {
                  e.currentTarget.style.outline = 'none';
                }
              }}
              onMouseEnter={(e) => {
                if (!estaSeleccionado) {
                  e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-hover)';
                }
              }}
              onMouseLeave={(e) => {
                if (!estaSeleccionado) {
                  e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                } else {
                  e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                }
              }}
            >
              {(() => {
                // Miniaturas nunca tienen imagen
                if (tamaño === 'miniatura') {
                  return null;
                }

                // Mostrar primera imagen si hay múltiples o imagen única
                const imagenUrl = adiso.imagenesUrls?.[0] || adiso.imagenUrl;
                const imageHeight = tamaño === 'pequeño'
                  ? isDesktop ? 140 : 130
                  : tamaño === 'mediano'
                    ? isDesktop ? 180 : 160
                    : tamaño === 'grande'
                      ? isDesktop ? 220 : 200
                      : isDesktop ? 260 : 240; // gigante

                if (imagenUrl) {
                  return (
                    <div style={{
                      width: '100%',
                      height: `${imageHeight}px`,
                      position: 'relative',
                      borderRadius: '6px',
                      marginBottom: '0.75rem',
                      flexShrink: 0,
                      overflow: 'hidden',
                      boxShadow: 'var(--shadow-sm)'
                    }}>
                      <Image
                        src={imagenUrl}
                        alt={adiso.titulo}
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        style={{
                          objectFit: 'cover',
                        }}
                        loading="lazy"
                      />
                    </div>
                  );
                } else {
                  // Placeholder para cards sin imagen
                  const IconComponent = getCategoriaIcon(adiso.categoria);
                  const colorCategoria = getCategoriaColor(adiso.categoria);

                  return (
                    <div style={{
                      width: '100%',
                      height: `${imageHeight}px`,
                      position: 'relative',
                      borderRadius: '6px',
                      marginBottom: '0.75rem',
                      flexShrink: 0,
                      overflow: 'hidden',
                      backgroundColor: `color-mix(in srgb, ${colorCategoria} 10%, var(--bg-secondary))`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: colorCategoria
                    }}>
                      <IconComponent size={Math.min(imageHeight * 0.4, 64)} />
                      {/* Visual Trust Indicator for Placeholder */}
                      {adiso.vendedor?.esVerificado && (
                        <div style={{
                          position: 'absolute',
                          top: '8px',
                          left: '8px',
                          zIndex: 2
                        }}>
                          <TrustBadge type="verified" size="sm" showLabel={false} />
                        </div>
                      )}
                    </div>
                  );
                }
              })()}
              <div style={{
                fontSize: tamaño === 'miniatura'
                  ? isDesktop ? '0.6875rem' : '0.625rem'
                  : tamaño === 'pequeño'
                    ? isDesktop ? '0.75rem' : '0.6875rem'
                    : tamaño === 'mediano'
                      ? isDesktop ? '0.8125rem' : '0.75rem'
                      : tamaño === 'grande'
                        ? isDesktop ? '0.875rem' : '0.8125rem'
                        : isDesktop ? '0.9375rem' : '0.875rem', // gigante
                color: getCategoriaColor(adiso.categoria),
                backgroundColor: `color-mix(in srgb, ${getCategoriaColor(adiso.categoria)} 10%, transparent)`,
                textTransform: 'capitalize',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                marginBottom: tamaño === 'miniatura' ? '0.25rem' : '0.375rem',
                padding: '0.25rem 0.5rem',
                borderRadius: '6px',
                fontWeight: 600,
                flexShrink: 0,
                alignSelf: 'flex-start',
                border: `1px solid color-mix(in srgb, ${getCategoriaColor(adiso.categoria)} 20%, transparent)`,
              }}>
                {(() => {
                  const IconComponent = getCategoriaIcon(adiso.categoria);
                  const iconSize = tamaño === 'miniatura'
                    ? isDesktop ? 11 : 10
                    : tamaño === 'pequeño'
                      ? isDesktop ? 12 : 11
                      : tamaño === 'mediano'
                        ? isDesktop ? 13 : 12
                        : tamaño === 'grande'
                          ? isDesktop ? 14 : 13
                          : isDesktop ? 15 : 14; // gigante
                  return <IconComponent size={iconSize} aria-hidden="true" />;
                })()}
                {adiso.categoria}
              </div>
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                minHeight: 0,
                overflow: 'hidden',
                gap: '0.25rem'
              }}>
                <h3 style={{
                  fontSize: tamaño === 'miniatura'
                    ? isDesktop ? '0.9375rem' : '0.875rem'
                    : '1rem', // Unificado para cleaner look
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  lineHeight: 1.3,
                  letterSpacing: '-0.01em',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  margin: 0,
                  wordBreak: 'break-word',
                  hyphens: 'auto',
                }}>
                  {adiso.titulo}
                </h3>

                {/* Meta info: Location and Time */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.75rem',
                  color: 'var(--text-tertiary)',
                  marginTop: 'auto',
                  paddingTop: '0.25rem'
                }}>
                  <span style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '100%'
                  }}>
                    {typeof adiso.ubicacion === 'string'
                      ? adiso.ubicacion
                      : (adiso.ubicacion as any)?.distrito || (adiso.ubicacion as any)?.provincia || 'Perú'}
                  </span>
                  {/* Optional: Add dot or separator if needed */}
                </div>
              </div>
              {estaSeleccionado && (
                <div style={{
                  position: 'absolute',
                  top: '0.5rem',
                  right: '0.5rem',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--text-primary)',
                  boxShadow: '0 0 0 2px var(--bg-primary)'
                }} />
              )}
            </button>
          );
        })}
        {/* Sentinel para scroll infinito */}
        <div
          ref={sentinelRef}
          style={{
            gridColumn: `1 / -1`,
            minHeight: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: cargandoMas ? '1rem' : '0.5rem',
            transition: 'padding 0.2s'
          }}
        >
          {cargandoMas && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.875rem',
              color: 'var(--text-secondary)'
            }}>
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid var(--border-color)',
                borderTopColor: 'var(--accent-color)',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite'
              }} />
              <span>Cargando más anuncios...</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
