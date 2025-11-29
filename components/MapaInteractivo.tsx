'use client';

import React, { useEffect, useRef } from 'react';
import { Aviso } from '@/types';

interface MapaInteractivoProps {
  avisos: Aviso[];
  onAbrirAviso: (aviso: Aviso) => void;
}

export default function MapaInteractivo({ avisos, onAbrirAviso }: MapaInteractivoProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Placeholder para integración futura con Leaflet o Google Maps
    // Por ahora mostramos un mensaje informativo
  }, [avisos]);

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        color: 'var(--text-secondary)',
        textAlign: 'center'
      }}
    >
      <div
        ref={mapRef}
        style={{
          width: '100%',
          height: '400px',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid var(--border-color)',
          marginBottom: '1rem'
        }}
      >
        <div>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🗺️</div>
          <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            Mapa Interactivo
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>
            Próximamente: Integración con mapa para buscar avisos por ubicación
          </div>
        </div>
      </div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
        Los avisos se mostrarán como marcadores en el mapa
      </div>
    </div>
  );
}

