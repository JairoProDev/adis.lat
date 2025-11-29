'use client';

import React from 'react';
import { Aviso, Categoria } from '@/types';
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
}

export default function GrillaAvisos({ avisos, onAbrirAviso }: GrillaAvisosProps) {
  return (
    <>
      <style jsx>{`
        .grilla-avisos {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }
        @media (min-width: 768px) {
          .grilla-avisos {
            grid-template-columns: repeat(4, 1fr);
          }
        }
      `}</style>
      <div className="grilla-avisos">
        {avisos.map((aviso) => (
          <button
            key={aviso.id}
            onClick={() => onAbrirAviso(aviso)}
            style={{
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '1rem',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 8px var(--shadow)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {aviso.imagenUrl && (
              <img
                src={aviso.imagenUrl}
                alt={aviso.titulo}
                style={{
                  width: '100%',
                  height: '150px',
                  objectFit: 'cover',
                  borderRadius: '6px',
                  marginBottom: '0.5rem'
                }}
              />
            )}
            <div style={{
              fontSize: '0.75rem',
              color: 'var(--text-tertiary)',
              textTransform: 'capitalize',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}>
              {(() => {
                const IconComponent = getCategoriaIcon(aviso.categoria);
                return <IconComponent size={14} />;
              })()}
              {aviso.categoria}
            </div>
            <h3 style={{
              fontSize: '1rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              lineHeight: 1.4,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>
              {aviso.titulo}
            </h3>
          </button>
        ))}
      </div>
    </>
  );
}

