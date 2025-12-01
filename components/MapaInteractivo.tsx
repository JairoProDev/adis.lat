'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Adiso, UbicacionDetallada } from '@/types';

interface MapaInteractivoProps {
  adisos: Adiso[];
  onAbrirAdiso: (adiso: Adiso) => void;
}

// Función helper para extraer coordenadas de un adiso
function getCoordenadas(adiso: Adiso): { lat: number; lng: number } | null {
  if (typeof adiso.ubicacion === 'object' && adiso.ubicacion !== null && 'latitud' in adiso.ubicacion) {
    const ubi = adiso.ubicacion as UbicacionDetallada;
    if (ubi.latitud && ubi.longitud) {
      return { lat: ubi.latitud, lng: ubi.longitud };
    }
  }
  return null;
}

// Función helper para obtener texto de ubicación
function getTextoUbicacion(adiso: Adiso): string {
  if (typeof adiso.ubicacion === 'object' && adiso.ubicacion !== null && 'distrito' in adiso.ubicacion) {
    const ubi = adiso.ubicacion as UbicacionDetallada;
    return `${ubi.distrito || ''}, ${ubi.provincia || ''}, ${ubi.departamento || ''}`.replace(/^,\s*|,\s*$/g, '');
  }
  return typeof adiso.ubicacion === 'string' ? adiso.ubicacion : 'Sin ubicación';
}

export default function MapaInteractivo({ adisos, onAbrirAdiso }: MapaInteractivoProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [adisoHovered, setAdisoHovered] = useState<string | null>(null);

  // Filtrar adisos que tienen coordenadas
  const adisosConCoordenadas = adisos.filter(adiso => getCoordenadas(adiso) !== null);

  useEffect(() => {
    // Placeholder para integración futura con Leaflet o Google Maps
    // Por ahora mostramos un mensaje informativo con lista de adisos
  }, [adisos]);

  if (adisosConCoordenadas.length === 0) {
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
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🗺️</div>
        <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
          Mapa Interactivo
        </div>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>
          No hay adisos con ubicación en el mapa
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.5rem' }}>
          Los adisos con coordenadas aparecerán aquí
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '1rem',
        gap: '1rem'
      }}
    >
      {/* Placeholder del mapa - aquí se integrará Leaflet o Google Maps */}
      <div
        ref={mapRef}
        style={{
          width: '100%',
          flex: 1,
          minHeight: '400px',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid var(--border-color)',
          position: 'relative'
        }}
      >
        <div style={{ textAlign: 'center', zIndex: 1 }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🗺️</div>
          <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            Mapa Interactivo
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>
            {adisosConCoordenadas.length} {adisosConCoordenadas.length === 1 ? 'adiso' : 'adisos'} con ubicación
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.5rem' }}>
            Próximamente: Integración con mapa interactivo
          </div>
        </div>
      </div>

      {/* Lista de adisos con ubicación */}
      <div style={{
        maxHeight: '200px',
        overflowY: 'auto',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        padding: '0.5rem'
      }}>
        <div style={{
          fontSize: '0.75rem',
          fontWeight: 600,
          color: 'var(--text-secondary)',
          marginBottom: '0.5rem',
          padding: '0 0.5rem'
        }}>
          Adisos con ubicación ({adisosConCoordenadas.length})
        </div>
        {adisosConCoordenadas.map(adiso => {
          const coords = getCoordenadas(adiso);
          const textoUbi = getTextoUbicacion(adiso);
          
          return (
            <button
              key={adiso.id}
              onClick={() => onAbrirAdiso(adiso)}
              onMouseEnter={() => setAdisoHovered(adiso.id)}
              onMouseLeave={() => setAdisoHovered(null)}
              style={{
                width: '100%',
                padding: '0.5rem',
                marginBottom: '0.25rem',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: adisoHovered === adiso.id ? 'var(--hover-bg)' : 'transparent',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '0.75rem',
                transition: 'background-color 0.2s'
              }}
            >
              <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>
                {adiso.titulo}
              </div>
              <div style={{ 
                fontSize: '0.7rem', 
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                📍 {textoUbi}
                {coords && (
                  <span style={{ color: 'var(--text-tertiary)', marginLeft: '0.5rem' }}>
                    ({coords.lat.toFixed(4)}, {coords.lng.toFixed(4)})
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

