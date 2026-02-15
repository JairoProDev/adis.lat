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

      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([-13.5319, -71.9675], 13); // Cusco Default

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
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

      // Coordinate jitter only if exact duplicate (or 0,0 for demo)
      let lat = coords.lat;
      let lng = coords.lng;

      if (Math.abs(lat) < 0.1 && Math.abs(lng) < 0.1) {
        // Demo jitter
        lat = -13.5319 + (Math.random() - 0.5) * 0.05;
        lng = -71.9675 + (Math.random() - 0.5) * 0.05;
      } else {
        // Small jitter to prevent exact overlap
        lat += (Math.random() - 0.5) * 0.0005;
        lng += (Math.random() - 0.5) * 0.0005;
      }

      const markerIcon = L.divIcon({
        className: 'custom-pin',
        html: `<div style="background-color: var(--brand-blue); width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3); font-size: 16px;">
                        ${getCategoryEmoji(adiso.categoria)}
                       </div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      const marker = L.marker([lat, lng], { icon: markerIcon })
        .bindPopup(`
                    <div style="min-width: 200px; font-family: system-ui, -apple-system, sans-serif;">
                        <h3 style="margin: 0 0 5px 0; font-size: 14px; font-weight: bold; color: #333;">${adiso.titulo}</h3>
                        <p style="margin: 0 0 8px 0; font-size: 12px; color: #666;">${adiso.precio ? `S/ ${adiso.precio}` : 'Consultar'}</p>
                        <button id="btn-${adiso.id}" style="background: var(--brand-blue); color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; width: 100%; font-weight: 500;">Ver Detalle</button>
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

  }, [adisosFiltrados, onAbrirAdiso]);

  const handleLocateMe = () => {
    if (!mapInstance.current) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          mapInstance.current.setView([latitude, longitude], 15);

          // Add 'You are here' marker if not exists
          L.marker([latitude, longitude], {
            icon: L.divIcon({
              className: 'user-loc',
              html: `<div style="width: 16px; height: 16px; background-color: #3b82f6; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3);"></div>`,
              iconSize: [20, 20]
            })
          }).addTo(mapInstance.current).bindPopup("Estás aquí").openPopup();
        },
        () => {
          alert("No se pudo obtener tu ubicación");
        }
      );
    }
  };

  const handleZoom = (delta: number) => {
    if (mapInstance.current) {
      mapInstance.current.setZoom(mapInstance.current.getZoom() + delta);
    }
  };

  return (
    <div className="relative w-full h-full">
      <div id="map" ref={mapContainerRef} className="w-full h-full z-0" style={{ minHeight: '400px', backgroundColor: '#e5e7eb' }}>
        {/* Leaflet map will render here */}
      </div>

      {/* Filters Overlay - Changed top position to avoid status bar overlap on mobile */}
      <div className="absolute top-4 left-4 right-16 z-[500] flex gap-2 overflow-x-auto pb-2 scrollbar-hide mask-linear-fade">
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
            className={`px-3 py-1.5 rounded-full text-xs font-medium border shadow-sm whitespace-nowrap transition-colors flex-shrink-0
                            ${filter === f.id
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Controls Group - Right Side */}
      <div className="absolute top-4 right-4 z-[500] flex flex-col gap-2">
        <button
          onClick={() => handleZoom(1)}
          className="w-10 h-10 bg-white rounded-xl shadow-md flex items-center justify-center text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors"
          title="Acercar"
        >
          <FaPlus size={14} />
        </button>
        <button
          onClick={() => handleZoom(-1)}
          className="w-10 h-10 bg-white rounded-xl shadow-md flex items-center justify-center text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors"
          title="Alejar"
        >
          <FaMinus size={14} />
        </button>
        <div className="h-2" /> {/* Spacer */}
        <button
          onClick={handleLocateMe}
          className="w-10 h-10 bg-white rounded-xl shadow-md flex items-center justify-center text-blue-600 hover:bg-gray-50 active:bg-gray-100 transition-colors"
          title="Mi Ubicación"
        >
          <FaLocationArrow size={14} />
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
