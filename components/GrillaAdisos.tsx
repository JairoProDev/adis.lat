'use client';

import React, { useEffect, useRef } from 'react';
import { Adiso } from '@/types';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useAuth } from '@/hooks/useAuth';
import { registrarClick } from '@/lib/analytics';
import AdisoCard from './AdisoCard';

interface GrillaAdisosProps {
  adisos: Adiso[];
  onAbrirAdiso: (adiso: Adiso) => void;
  adisoSeleccionadoId?: string | null;
  espacioAdicional?: number;
  cargandoMas?: boolean;
  sentinelRef?: React.RefObject<HTMLDivElement>;
}

export default function GrillaAdisos({
  adisos,
  onAbrirAdiso,
  adisoSeleccionadoId,
  espacioAdicional = 0,
  cargandoMas = false,
  sentinelRef
}: GrillaAdisosProps) {
  const adisoRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const { user } = useAuth();

  const handleClickAdiso = (adiso: Adiso) => {
    registrarClick(user?.id, adiso.id, adiso.categoria);
    onAbrirAdiso(adiso);
  };

  // Scroll automático cuando cambia el adiso seleccionado
  useEffect(() => {
    if (adisoSeleccionadoId && adisoRefs.current[adisoSeleccionadoId]) {
      const elemento = adisoRefs.current[adisoSeleccionadoId];
      if (elemento) {
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
          /* Mobile: 2 columns fixed */
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem;
          grid-auto-rows: auto;
          grid-auto-flow: dense;
        }
        
        @media (min-width: 768px) {
             .grilla-adisos {
                /* Desktop: Adaptive columns */
                grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                gap: 1.5rem;
             }
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div className="grilla-adisos pb-20">
        {adisos.map((adiso) => (
          <AdisoCard
            key={adiso.id}
            ref={(el) => {
              adisoRefs.current[adiso.id] = el;
            }}
            adiso={adiso}
            onClick={() => handleClickAdiso(adiso)}
            estaSeleccionado={adiso.id === adisoSeleccionadoId}
            isDesktop={isDesktop}
          />
        ))}

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
