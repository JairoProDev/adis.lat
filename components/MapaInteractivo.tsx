'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Adiso, UbicacionDetallada, Categoria } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { FaMapMarkerAlt, FaPlus, FaMinus, FaLocationArrow, FaHome, FaBriefcase, FaCar, FaShoppingBag } from 'react-icons/fa';

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

function getPinIcon(categoria: Categoria) {
  switch (categoria) {
    case 'inmuebles': return '🏠';
    case 'empleos': return '💼';
    case 'vehiculos': return '🚗';
    case 'servicios': return '🔧';
    case 'productos': return '🛍️';
    case 'eventos': return '🎉';
    case 'negocios': return '🏪';
    default: return '📍';
  }
}

export default function MapaInteractivo({ adisos, onAbrirAdiso }: MapaInteractivoProps) {
  const [scale, setScale] = useState(1);
  const [adisoHovered, setAdisoHovered] = useState<string | null>(null);
  const [filter, setFilter] = useState<Categoria | 'todos'>('todos');

  // Filtrar adisos que tienen coordenadas
  const adisosConCoordenadas = adisos.filter(adiso =>
    getCoordenadas(adiso) !== null &&
    (filter === 'todos' || adiso.categoria === filter)
  );

  // Centro aproximado de Cusco para el prototipo
  const CENTER_LAT = -13.5319;
  const CENTER_LNG = -71.9675;
  const SPREAD = 0.05; // Grados de dispersión para el mapeo

  // Mapear coordenadas a porcentaje en el contenedor (0-100)
  const getPosition = (lat: number, lng: number) => {
    // Normalizar relativo al centro
    // Invertir Y porque latitud va de sur (negativo) a norte
    const y = ((lat - (CENTER_LAT + SPREAD)) / (-SPREAD * 2)) * 100;
    const x = ((lng - (CENTER_LNG - SPREAD)) / (SPREAD * 2)) * 100;

    // Clamp para mantener dentro del mapa visible (o dejar salir si es drag)
    return { x, y };
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>

      {/* Filtros Superiores */}
      <div style={{
        position: 'absolute',
        top: '1rem',
        left: '1rem',
        zIndex: 30,
        display: 'flex',
        gap: '0.5rem',
        overflowX: 'auto',
        maxWidth: 'calc(100% - 60px)',
        paddingBottom: '0.5rem',
        scrollbarWidth: 'none'
      }}>
        {[
          { id: 'todos', label: 'Todos' },
          { id: 'inmuebles', label: '🏠 Casas' },
          { id: 'empleos', label: '💼 Empleos' },
          { id: 'vehiculos', label: '🚗 Autos' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id as any)}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: '20px',
              border: '1px solid',
              borderColor: filter === f.id ? 'var(--accent-color)' : 'var(--border-color)',
              backgroundColor: filter === f.id ? 'var(--accent-color)' : 'var(--bg-primary)',
              color: filter === f.id ? 'white' : 'var(--text-primary)',
              fontSize: '0.75rem',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              transition: 'all 0.2s'
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Controles de Mapa */}
      <div style={{
        position: 'absolute',
        top: '1rem',
        right: '1rem',
        zIndex: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
      }}>
        <button
          onClick={() => {
            // Simulate "locate me"
            setScale(2);
          }}
          title="Mi ubicación"
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            color: 'var(--accent-color)'
          }}
        >
          <FaLocationArrow />
        </button>
        <div style={{ height: '0.5rem' }} />
        <button
          onClick={() => setScale(s => Math.min(s + 0.5, 4))}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            color: 'var(--text-primary)'
          }}
        >
          <FaPlus />
        </button>
        <button
          onClick={() => setScale(s => Math.max(s - 0.5, 1))}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            color: 'var(--text-primary)'
          }}
        >
          <FaMinus />
        </button>
      </div>

      {/* Área del Mapa */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', backgroundColor: '#f3f4f6' }}>
        <motion.div
          drag
          dragConstraints={{ left: -1000 * scale, right: 0, top: -1000 * scale, bottom: 0 }}
          animate={{ scale }}
          style={{
            width: '200%',
            height: '200%',
            x: -250, // Centrar inicial
            y: -250,
            // CSS Pattern to look like a map
            backgroundColor: '#f8fafc',
            backgroundImage: `
                linear-gradient(rgba(200, 200, 200, 0.3) 1px, transparent 1px),
                linear-gradient(90deg, rgba(200, 200, 200, 0.3) 1px, transparent 1px),
                linear-gradient(rgba(0, 0, 0, 0.05) 2px, transparent 2px),
                linear-gradient(90deg, rgba(0, 0, 0, 0.05) 2px, transparent 2px)
             `,
            backgroundSize: '100px 100px, 100px 100px, 20px 20px, 20px 20px',
            position: 'relative',
            cursor: 'grab'
          }}
          whileTap={{ cursor: 'grabbing' }}
        >
          {/* Bloques "Parques" simulados con CSS */}
          <div style={{ position: 'absolute', top: '40%', left: '45%', width: '10%', height: '8%', backgroundColor: '#dcfce7', borderRadius: '20px', opacity: 0.6 }}></div>
          <div style={{ position: 'absolute', top: '60%', left: '60%', width: '15%', height: '12%', backgroundColor: '#dcfce7', borderRadius: '30px', opacity: 0.6 }}></div>
          <div style={{ position: 'absolute', top: '20%', left: '30%', width: '8%', height: '15%', backgroundColor: '#e0f2fe', borderRadius: '50px', transform: 'rotate(45deg)', opacity: 0.6 }}></div>

          {/* Marcadores */}
          {adisosConCoordenadas.map((adiso, i) => {
            const coords = getCoordenadas(adiso);
            if (!coords) return null;

            // Si las coordenadas son 0,0 o muy lejanas, generar "fake" coords cerca del centro para el demo
            // SOLO para el prototipo si el usuario quiere que "parezca real" y no tenemos coords reales en DB
            const isValidCoord = coords.lat !== 0 && coords.lng !== 0;
            const finalLat = isValidCoord ? coords.lat : CENTER_LAT + (Math.random() - 0.5) * 0.04;
            const finalLng = isValidCoord ? coords.lng : CENTER_LNG + (Math.random() - 0.5) * 0.04;

            const pos = getPosition(finalLat, finalLng);
            const isHovered = adisoHovered === adiso.id;
            const emoji = getPinIcon(adiso.categoria);

            return (
              <motion.div
                key={adiso.id}
                style={{
                  position: 'absolute',
                  left: `${pos.x + 50}%`, // Centrar en el 200% width
                  top: `${pos.y + 50}%`,
                  zIndex: isHovered ? 100 : 1
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
              >
                <div
                  style={{ position: 'relative' }}
                  onMouseEnter={() => setAdisoHovered(adiso.id)}
                  onMouseLeave={() => setAdisoHovered(null)}
                  onClick={() => onAbrirAdiso(adiso)}
                >
                  <motion.div
                    animate={isHovered ? { scale: 1.2, y: -5 } : { scale: 1, y: 0 }}
                    style={{
                      fontSize: '1.5rem',
                      cursor: 'pointer',
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
                      position: 'relative'
                    }}
                  >
                    {emoji}
                    {/* Pulse effect if hovered */}
                    {isHovered && (
                      <motion.div
                        initial={{ scale: 1, opacity: 0.5 }}
                        animate={{ scale: 1.5, opacity: 0 }}
                        transition={{ repeat: Infinity, duration: 1 }}
                        style={{
                          position: 'absolute',
                          top: 0, left: 0, right: 0, bottom: 0,
                          borderRadius: '50%',
                          border: '2px solid var(--accent-color)',
                        }}
                      />
                    )}
                  </motion.div>

                  {/* Tooltip del Marcador */}
                  <AnimatePresence>
                    {isHovered && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.8 }}
                        style={{
                          position: 'absolute',
                          bottom: '100%',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          marginBottom: '8px',
                          backgroundColor: 'var(--bg-primary)',
                          padding: '0.5rem',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          width: '200px',
                          pointerEvents: 'none',
                          zIndex: 200,
                          border: '1px solid var(--border-color)'
                        }}
                      >
                        {adiso.imagenUrl && (
                          <div style={{ width: '100%', height: '80px', marginBottom: '4px', borderRadius: '4px', overflow: 'hidden' }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={adiso.imagenUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        )}
                        <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: '1.2' }}>
                          {adiso.titulo}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: '2px' }}>
                          {adiso.precio ? `S/ ${adiso.precio}` : 'Consultar'}
                        </div>
                        {/* Flechita tooltip */}
                        <div style={{
                          position: 'absolute',
                          bottom: '-6px',
                          left: '50%',
                          marginLeft: '-6px',
                          width: '12px',
                          height: '12px',
                          backgroundColor: 'var(--bg-primary)',
                          transform: 'rotate(45deg)',
                          borderRight: '1px solid var(--border-color)',
                          borderBottom: '1px solid var(--border-color)',
                          zIndex: -1
                        }} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Overlay informativo inferior */}
        <div style={{
          position: 'absolute',
          bottom: '1rem',
          left: '1rem',
          right: '1rem',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(8px)',
          padding: '0.75rem',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          zIndex: 10
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
          }}>
            <FaLocationArrow size={14} />
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Explora Cusco</div>
            <div>{adisosConCoordenadas.length} avisos visibles en esta zona</div>
          </div>
        </div>
      </div>

      {/* Lista lateral/inferior compacta */}
      <div style={{
        height: '30%',
        backgroundColor: 'var(--bg-primary)',
        borderTop: '1px solid var(--border-color)',
        overflowY: 'auto',
        padding: '0.5rem'
      }}>
        <h3 style={{ fontSize: '0.85rem', fontWeight: 600, padding: '0.5rem', margin: 0 }}>
          Resultados en el área
        </h3>
        {adisosConCoordenadas.length === 0 ? (
          <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
            No se encontraron avisos con ubicación.
          </div>
        ) : (
          adisosConCoordenadas.map(adiso => (
            <div
              key={adiso.id}
              onClick={() => onAbrirAdiso(adiso)}
              onMouseEnter={() => setAdisoHovered(adiso.id)}
              onMouseLeave={() => setAdisoHovered(null)}
              style={{
                display: 'flex',
                gap: '0.75rem',
                padding: '0.5rem',
                borderRadius: '8px',
                cursor: 'pointer',
                backgroundColor: adisoHovered === adiso.id ? 'var(--bg-secondary)' : 'transparent',
                transition: 'all 0.2s',
                borderBottom: '1px solid var(--border-subtle)'
              }}
            >
              {adiso.imagenUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={adiso.imagenUrl}
                  alt=""
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '8px',
                    objectFit: 'cover',
                    backgroundColor: 'var(--bg-secondary)'
                  }}
                />
              ) : (
                <div style={{ width: '60px', height: '60px', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                  {getPinIcon(adiso.categoria)}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {adiso.titulo}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--accent-color)', fontWeight: 500 }}>
                  {adiso.precio ? `S/ ${adiso.precio}` : 'Consultar'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                  <FaMapMarkerAlt size={10} /> {getTextoUbicacion(adiso)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
