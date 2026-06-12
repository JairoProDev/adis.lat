'use client';

import React, { useEffect, useRef } from 'react';
import { Adiso } from '@/types';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useAuth } from '@/hooks/useAuth';
import { registrarClick } from '@/lib/analytics';
import AdisoCard from './AdisoCard';
import { SkeletonCard } from './SkeletonAdisos';

interface GrillaAdisosProps {
  adisos: Adiso[];
  onAbrirAdiso: (adiso: Adiso) => void;
  adisoSeleccionadoId?: string | null;
  espacioAdicional?: number;
  cargandoMas?: boolean;
  sentinelRef?: React.RefObject<HTMLDivElement>;
  vista?: 'grid' | 'list' | 'feed';
}

function isElementInViewport(el: HTMLElement): boolean {
  const rect = el.getBoundingClientRect();
  const vh = window.innerHeight || document.documentElement.clientHeight;
  return rect.top >= 0 && rect.bottom <= vh;
}

export default function GrillaAdisos({
  adisos,
  onAbrirAdiso,
  adisoSeleccionadoId,
  espacioAdicional = 0,
  cargandoMas = false,
  sentinelRef,
  vista = 'grid',
}: GrillaAdisosProps) {
  const adisoRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const { user } = useAuth();
  const columnMin = espacioAdicional > 0 ? 240 : 200;

  const handleClickAdiso = (adiso: Adiso) => {
    registrarClick(user?.id, adiso.id, adiso.categoria);
    onAbrirAdiso(adiso);
  };

  useEffect(() => {
    if (!adisoSeleccionadoId) return;
    const elemento = adisoRefs.current[adisoSeleccionadoId];
    if (!elemento || isElementInViewport(elemento)) return;

    const timer = setTimeout(() => {
      elemento.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'center',
        inline: 'nearest',
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [adisoSeleccionadoId]);

  return (
    <>
      <style jsx>{`
        .grilla-adisos {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--space-3, 12px);
          grid-auto-rows: auto;
        }

        .grilla-adisos.vista-list {
          grid-template-columns: 1fr !important;
          gap: var(--space-4, 16px);
        }

        .grilla-adisos.vista-feed {
          grid-template-columns: 1fr !important;
          gap: var(--space-6, 24px);
          max-width: 480px;
          margin: 0 auto;
        }

        @media (min-width: 768px) {
          .grilla-adisos {
            grid-template-columns: repeat(auto-fill, minmax(${columnMin}px, 1fr));
            gap: var(--space-6, 24px);
          }

          .grilla-adisos.vista-feed {
            max-width: 560px;
          }
        }
      `}</style>

      <div
        className={`grilla-adisos pb-20 ${
          vista === 'list' ? 'vista-list' : vista === 'feed' ? 'vista-feed' : ''
        }`}
      >
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
            vista={vista}
          />
        ))}

        {cargandoMas &&
          Array.from({ length: 4 }).map((_, i) => (
            <div key={`skeleton-${i}`} style={{ gridColumn: vista === 'grid' ? 'span 1' : '1 / -1' }}>
              <SkeletonCard />
            </div>
          ))}

        <div
          ref={sentinelRef}
          style={{
            gridColumn: '1 / -1',
            minHeight: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: cargandoMas ? '0.5rem' : '0.25rem',
          }}
          aria-hidden={!cargandoMas}
        />
      </div>
    </>
  );
}
