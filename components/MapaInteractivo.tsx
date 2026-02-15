'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Adiso, UbicacionDetallada, Categoria } from '@/types';
import { FaMapMarkerAlt, FaLocationArrow, FaPlus, FaMinus } from 'react-icons/fa';

// Declare L global
declare const L: any;

interface MapaInteractivoProps {
  adisos: Adiso[];
  onAbrirAdiso: (adiso: Adiso) => void;
}

function getCoordenadas(adiso: Adiso): { lat: number; lng: number } | null {
  if (typeof adiso.ubicacion === 'object' && adiso.ubicacion !== null && 'latitud' in adiso.ubicacion) {
    const ubi = adiso.ubicacion as UbicacionDetallada;
    if (ubi.latitud && ubi.longitud) {
      return { lat: ubi.latitud, lng: ubi.longitud };
    }
  }
  return null;
}

export default function MapaInteractivo({ adisos, onAbrirAdiso }: MapaInteractivoProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [filter, setFilter] = useState<Categoria | 'todos'>('todos');

  // Filter adisos
  const adisosFiltrados = adisos.filter(adiso =>
    (filter === 'todos' || adiso.categoria === filter) &&
    getCoordenadas(adiso) !== null
  );

  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current || mapInstance.current) return;

    // Initialize Map
    try {
      if (typeof L === 'undefined') {
        console.warn('Leaflet not loaded yet');
        return;
      }

      const map = L.map(mapContainerRef.current).setView([-13.5319, -71.9675], 13); // Cusco Default

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      mapInstance.current = map;
    } catch (e) {
      console.error('Error initializing map', e);
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Update markers
  useEffect(() => {
    if (!mapInstance.current || typeof L === 'undefined') return;

    // Clear existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const markersGroup = L.featureGroup();

    adisosFiltrados.forEach(adiso => {
      const coords = getCoordenadas(adiso);
      if (!coords) return;

      // Generate fake coords near Cusco center if both are 0 (demo mode)
      // SOLO para el prototipo si el usuario quiere que "parezca real" y no tenemos coords reales en DB
      let lat = coords.lat;
      let lng = coords.lng;

      if (lat === 0 && lng === 0) {
        lat = -13.5319 + (Math.random() - 0.5) * 0.05;
        lng = -71.9675 + (Math.random() - 0.5) * 0.05;
      }

      const markerIcon = L.divIcon({
        className: 'custom-pin',
        html: `<div style="background-color: var(--brand-blue); width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">
                        <span style="font-size: 16px;">${getCategoryEmoji(adiso.categoria)}</span>
                       </div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      const marker = L.marker([lat, lng], { icon: markerIcon })
        .bindPopup(`
                    <div style="min-width: 200px;">
                        <h3 style="margin: 0 0 5px 0; font-size: 14px; font-weight: bold;">${adiso.titulo}</h3>
                        <p style="margin: 0 0 5px 0; font-size: 12px; color: #666;">${adiso.precio ? `S/ ${adiso.precio}` : 'Consultar'}</p>
                        <button id="btn-${adiso.id}" style="background: var(--brand-blue); color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 12px; width: 100%;">Ver Detalle</button>
                    </div>
                `);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-${adiso.id}`);
        if (btn) {
          btn.onclick = () => onAbrirAdiso(adiso);
        }
      });

      marker.addTo(mapInstance.current);
      markersGroup.addLayer(marker);
      markersRef.current.push(marker);
    });

    // Fit bounds if markers exist
    if (markersRef.current.length > 0) {
      // mapInstance.current.fitBounds(markersGroup.getBounds().pad(0.1));
    }

  }, [adisosFiltrados, onAbrirAdiso]); // Ensure markers update when filter changes

  return (
    <div className="relative w-full h-full">
      <div id="map" ref={mapContainerRef} className="w-full h-full z-0" style={{ minHeight: '400px', backgroundColor: '#e5e7eb' }}>
        {/* Leaflet map will render here */}
      </div>

      {/* Filters Overlay */}
      <div className="absolute top-4 left-4 z-[500] flex gap-2 overflow-x-auto max-w-[calc(100%-60px)] pb-2 scrollbar-hide">
        {[
          { id: 'todos', label: 'Todos' },
          { id: 'inmuebles', label: '🏠 Casas' },
          { id: 'empleos', label: '💼 Empleos' },
          { id: 'vehiculos', label: '🚗 Autos' },
          { id: 'servicios', label: '🔧 Servicios' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id as any)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border shadow-sm whitespace-nowrap transition-colors
                            ${filter === f.id
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="absolute top-4 right-4 z-[500] flex flex-col gap-2">
        <button
          onClick={() => {
            if (mapInstance.current) {
              mapInstance.current.setView([-13.5319, -71.9675], 15);
            }
          }}
          className="w-9 h-9 bg-white rounded-lg shadow-md flex items-center justify-center text-blue-600 hover:bg-gray-50"
          title="Centrar en Cusco"
        >
          <FaLocationArrow />
        </button>
      </div>

      {/* Bottom Info */}
      <div className="absolute bottom-4 left-4 right-4 z-[500]">
        <div className="bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-gray-200 flex justify-between items-center text-sm">
          <span className="font-medium text-gray-700">{adisosFiltrados.length} avisos en esta zona</span>
        </div>
      </div>
    </div>
  );
}

function getCategoryEmoji(cat: Categoria) {
  switch (cat) {
    case 'inmuebles': return '🏠';
    case 'empleos': return '💼';
    case 'vehiculos': return '🚗';
    case 'servicios': return '🔧';
    default: return '📍';
  }
}
