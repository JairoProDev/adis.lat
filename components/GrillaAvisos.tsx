'use client';

import React, { useEffect, useRef } from 'react';
import { Aviso, Categoria, PAQUETES } from '@/types';
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

interface GrillaAvisosProps {
  avisos: Aviso[];
  onAbrirAviso: (aviso: Aviso) => void;
  avisoSeleccionadoId?: string | null;
}

export default function GrillaAvisos({ avisos, onAbrirAviso, avisoSeleccionadoId }: GrillaAvisosProps) {
  const avisoRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  // Scroll automático cuando cambia el aviso seleccionado
  useEffect(() => {
    if (avisoSeleccionadoId && avisoRefs.current[avisoSeleccionadoId]) {
      const elemento = avisoRefs.current[avisoSeleccionadoId];
      if (elemento) {
        // Esperar un poco para que el DOM se actualice
        setTimeout(() => {
          elemento.scrollIntoView({
            behavior: 'smooth',
            block: 'center', // Centrar verticalmente en la vista
            inline: 'nearest' // No hacer scroll horizontal a menos que sea necesario
          });
        }, 100);
      }
    }
  }, [avisoSeleccionadoId]);

  return (
    <>
      <style jsx>{`
        .grilla-avisos {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.5rem;
          grid-auto-rows: minmax(60px, auto);
        }
        @media (min-width: 768px) {
          .grilla-avisos {
            grid-template-columns: repeat(4, 1fr);
            grid-auto-rows: minmax(75px, auto);
          }
        }
      `}</style>
      <div className="grilla-avisos">
        {avisos.map((aviso) => {
          const estaSeleccionado = aviso.id === avisoSeleccionadoId;
          const tamaño = aviso.tamaño || 'miniatura';
          const paquete = PAQUETES[tamaño];
          
          // Calcular grid span según el tamaño
          const gridColumnSpan = paquete.columnas;
          const gridRowSpan = paquete.filas;
          
          return (
            <button
              key={aviso.id}
              ref={(el) => {
                avisoRefs.current[aviso.id] = el;
              }}
              onClick={() => onAbrirAviso(aviso)}
              style={{
                backgroundColor: estaSeleccionado ? 'var(--hover-bg)' : 'var(--bg-primary)',
                border: estaSeleccionado 
                  ? '2px solid var(--text-primary)' 
                  : '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: tamaño === 'miniatura' ? '0.5rem' : tamaño === 'pequeño' ? '0.625rem' : '0.75rem',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                flexDirection: 'column',
                gap: tamaño === 'miniatura' ? '0.2rem' : tamaño === 'pequeño' ? '0.3rem' : '0.4rem',
                position: 'relative',
                boxShadow: estaSeleccionado ? '0 4px 12px rgba(0, 0, 0, 0.15)' : 'none',
                gridColumn: `span ${gridColumnSpan}`,
                gridRow: `span ${gridRowSpan}`,
                height: '100%',
                justifyContent: 'flex-start'
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
              const imagenUrl = aviso.imagenesUrls?.[0] || aviso.imagenUrl;
              return imagenUrl ? (
                <img
                  src={imagenUrl}
                  alt={aviso.titulo}
                  style={{
                    width: '100%',
                    height: tamaño === 'pequeño' ? '80px' : tamaño === 'mediano' ? '100px' : tamaño === 'grande' ? '140px' : '180px',
                    objectFit: 'cover',
                    borderRadius: '4px',
                    marginBottom: '0.3rem'
                  }}
                />
              ) : null;
            })()}
            <div style={{
              fontSize: tamaño === 'miniatura' ? '0.6rem' : tamaño === 'pequeño' ? '0.65rem' : '0.7rem',
              color: 'var(--text-tertiary)',
              textTransform: 'capitalize',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              marginBottom: tamaño === 'miniatura' ? '0.1rem' : '0.15rem'
            }}>
              {(() => {
                const IconComponent = getCategoriaIcon(aviso.categoria);
                return <IconComponent size={tamaño === 'miniatura' ? 10 : tamaño === 'pequeño' ? 11 : 12} />;
              })()}
              {aviso.categoria}
            </div>
            <h3 style={{
              fontSize: tamaño === 'miniatura' ? '0.75rem' : tamaño === 'pequeño' ? '0.8125rem' : tamaño === 'mediano' ? '0.875rem' : tamaño === 'grande' ? '0.9375rem' : '1rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              lineHeight: 1.3,
              display: '-webkit-box',
              WebkitLineClamp: tamaño === 'miniatura' ? 1 : tamaño === 'pequeño' ? 1 : tamaño === 'mediano' ? 2 : tamaño === 'grande' ? 2 : 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              margin: 0
            }}>
              {aviso.titulo}
            </h3>
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
