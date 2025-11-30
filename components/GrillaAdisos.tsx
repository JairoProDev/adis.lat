'use client';

import React, { useEffect, useRef } from 'react';
import { Adiso, Categoria, PAQUETES } from '@/types';
import { useMediaQuery } from '@/hooks/useMediaQuery';
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
}

export default function GrillaAdisos({ adisos, onAbrirAdiso, adisoSeleccionadoId, espacioAdicional = 0 }: GrillaAdisosProps) {
  const adisoRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const isDesktop = useMediaQuery('(min-width: 768px)');
  
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

  return (
    <>
      <style jsx>{`
        .grilla-adisos {
          display: grid;
          grid-template-columns: repeat(${isDesktop ? columnas : 2}, 1fr);
          gap: 0.5rem;
          grid-auto-rows: minmax(${isDesktop ? '80px' : '80px'}, auto);
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
              onClick={() => onAbrirAdiso(adiso)}
              aria-label={`Ver detalles del adiso: ${adiso.titulo} en ${adiso.categoria}`}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onAbrirAdiso(adiso);
                }
              }}
              style={{
                backgroundColor: estaSeleccionado ? 'var(--hover-bg)' : 'var(--bg-primary)',
                border: estaSeleccionado 
                  ? '2px solid var(--text-primary)' 
                  : '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: tamaño === 'miniatura' 
                  ? isDesktop ? '0.6rem' : '0.5rem'
                  : tamaño === 'pequeño' 
                  ? isDesktop ? '0.75rem' : '0.65rem'
                  : tamaño === 'mediano' 
                  ? '0.875rem' 
                  : tamaño === 'grande'
                  ? '1rem'
                  : '1.125rem', // gigante
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                flexDirection: 'column',
                gap: tamaño === 'miniatura' 
                  ? '0.25rem' 
                  : tamaño === 'pequeño' 
                  ? '0.35rem' 
                  : '0.4rem',
                position: 'relative',
                boxShadow: estaSeleccionado ? '0 4px 12px rgba(0, 0, 0, 0.15)' : 'none',
                gridColumn: `span ${gridColumnSpan}`,
                gridRow: `span ${gridRowSpan}`,
                height: '100%',
                justifyContent: 'flex-start',
                overflow: 'hidden', // Asegura que el contenido no se desborde
                minHeight: 0, // Permite que flexbox funcione correctamente
                outline: 'none', // Se manejará con focus-visible
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
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 8px var(--shadow)';
                }
              }}
              onMouseLeave={(e) => {
                if (!estaSeleccionado) {
                  e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                } else {
                  e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
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
              return imagenUrl ? (
                <img
                  src={imagenUrl}
                  alt={adiso.titulo}
                  style={{
                    width: '100%',
                    height: tamaño === 'pequeño' 
                      ? isDesktop ? '130px' : '120px'
                      : tamaño === 'mediano' 
                      ? isDesktop ? '150px' : '140px'
                      : tamaño === 'grande' 
                      ? isDesktop ? '190px' : '180px'
                      : isDesktop ? '230px' : '220px', // gigante
                    objectFit: 'cover',
                    borderRadius: '4px',
                    marginBottom: '0.3rem',
                    flexShrink: 0 // No permitir que la imagen se comprima
                  }}
                />
              ) : null;
            })()}
            <div style={{
              fontSize: tamaño === 'miniatura' 
                ? isDesktop ? '0.7rem' : '0.65rem'
                : tamaño === 'pequeño'
                ? isDesktop ? '0.75rem' : '0.7rem'
                : tamaño === 'mediano'
                ? isDesktop ? '0.8rem' : '0.75rem'
                : tamaño === 'grande'
                ? isDesktop ? '0.875rem' : '0.8rem'
                : isDesktop ? '0.95rem' : '0.9rem', // gigante
              color: 'var(--text-tertiary)',
              textTransform: 'capitalize',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              marginBottom: tamaño === 'miniatura' ? '0.15rem' : '0.2rem',
              flexShrink: 0 // No permitir que la categoría se reduzca
            }}>
              {(() => {
                const IconComponent = getCategoriaIcon(adiso.categoria);
                const iconSize = tamaño === 'miniatura' 
                  ? isDesktop ? 12 : 11
                  : tamaño === 'pequeño'
                  ? isDesktop ? 13 : 12
                  : tamaño === 'mediano'
                  ? isDesktop ? 14 : 13
                  : tamaño === 'grande'
                  ? isDesktop ? 15 : 14
                  : isDesktop ? 16 : 15; // gigante
                return <IconComponent size={iconSize} />;
              })()}
              {adiso.categoria}
            </div>
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              minHeight: 0,
              overflow: 'hidden'
            }}>
              <h3 style={{
                fontSize: tamaño === 'miniatura' 
                  ? isDesktop ? '0.875rem' : '0.8rem'
                  : tamaño === 'pequeño'
                  ? isDesktop ? '1.125rem' : '1rem'
                  : tamaño === 'mediano'
                  ? isDesktop ? '1.375rem' : '1.25rem'
                  : tamaño === 'grande'
                  ? isDesktop ? '1.625rem' : '1.5rem'
                  : isDesktop ? '1.875rem' : '1.75rem', // gigante
                fontWeight: tamaño === 'miniatura' 
                  ? 600 
                  : tamaño === 'pequeño' 
                  ? 700 
                  : tamaño === 'mediano' 
                  ? 700 
                  : tamaño === 'grande' 
                  ? 800 
                  : 900, // gigante más bold
                color: 'var(--text-primary)',
                lineHeight: tamaño === 'miniatura' 
                  ? 1.3 
                  : tamaño === 'pequeño'
                  ? 1.3
                  : tamaño === 'mediano'
                  ? 1.3
                  : tamaño === 'grande'
                  ? 1.25
                  : 1.25, // gigante
                display: '-webkit-box',
                WebkitLineClamp: tamaño === 'miniatura' 
                  ? isDesktop ? 3 : 2  // 2-3 líneas en miniatura
                  : tamaño === 'pequeño'
                  ? isDesktop ? 3 : 2
                  : tamaño === 'mediano'
                  ? isDesktop ? 4 : 3
                  : tamaño === 'grande'
                  ? isDesktop ? 5 : 4
                  : isDesktop ? 6 : 5, // gigante
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                margin: 0,
                wordBreak: 'break-word',
                hyphens: 'auto',
                flex: 1,
                minHeight: 0
              }}>
                {adiso.titulo}
              </h3>
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
      </div>
    </>
  );
}
