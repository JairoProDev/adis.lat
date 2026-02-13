'use client';

import React, { useState, useRef, useEffect } from 'react';
import { UbicacionDetallada } from '@/types';
import {
  getDepartamentos,
  getProvincias,
  getDistritos
} from '@/lib/peru-ubicaciones';
import { IconLocation } from './Icons';
import { FaMapMarkerAlt, FaTimes } from 'react-icons/fa';

interface FiltroUbicacionProps {
  value?: {
    departamento?: string;
    provincia?: string;
    distrito?: string;
    radioKm?: number;
  };
  onChange: (filtro: {
    departamento?: string;
    provincia?: string;
    distrito?: string;
    radioKm?: number;
  } | undefined) => void;
  // Callback when "Aplicar" is clicked - returns the new filter
  onAplicar?: (filtro: {
    departamento?: string;
    provincia?: string;
    distrito?: string;
    radioKm?: number;
  } | undefined) => void;
  ubicacionUsuario?: UbicacionDetallada;
  // New props for modal mode
  onCerrar?: () => void;
  filtrosActuales?: any; // Compatibility with page.tsx usage
}

export default function FiltroUbicacion({ value, onChange, onAplicar, ubicacionUsuario, onCerrar, filtrosActuales }: FiltroUbicacionProps) {
  // Support both prop names for value
  const initialValue = value || filtrosActuales;

  const [mostrarFiltro, setMostrarFiltro] = useState(false);
  const [departamento, setDepartamento] = useState(initialValue?.departamento || '');
  const [provincia, setProvincia] = useState(initialValue?.provincia || '');
  const [distrito, setDistrito] = useState(initialValue?.distrito || '');
  const [radioKm, setRadioKm] = useState(initialValue?.radioKm || 5);
  const [usarMiUbicacion, setUsarMiUbicacion] = useState(false);
  const contenedorRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const departamentos = getDepartamentos();
  const provincias = departamento ? getProvincias(departamento) : [];
  const distritos = (departamento && provincia) ? getDistritos(departamento, provincia) : [];

  // Update state when initialValue changes
  useEffect(() => {
    if (initialValue) {
      setDepartamento(initialValue.departamento || '');
      setProvincia(initialValue.provincia || '');
      setDistrito(initialValue.distrito || '');
      setRadioKm(initialValue.radioKm || 5);
    }
  }, [initialValue]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // If modal mode
      if (onCerrar && modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onCerrar();
      }
      // If dropdown mode
      else if (!onCerrar && contenedorRef.current && !contenedorRef.current.contains(event.target as Node)) {
        setMostrarFiltro(false);
      }
    };

    if (mostrarFiltro || onCerrar) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mostrarFiltro, onCerrar]);

  const commitChanges = (newFiltros: any) => {
    if (onAplicar) {
      onAplicar(newFiltros);
    } else {
      onChange(newFiltros);
    }
  };

  const handleAplicar = () => {
    let result;
    if (usarMiUbicacion && ubicacionUsuario) {
      result = {
        distrito: ubicacionUsuario.distrito,
        provincia: ubicacionUsuario.provincia,
        departamento: ubicacionUsuario.departamento,
        radioKm: radioKm
      };
    } else if (distrito) {
      result = {
        distrito,
        provincia,
        departamento,
        radioKm: radioKm
      };
    } else if (provincia) {
      result = {
        provincia,
        departamento,
        radioKm: radioKm
      };
    } else if (departamento) {
      result = {
        departamento,
        radioKm: radioKm
      };
    } else {
      result = undefined;
    }

    commitChanges(result);
    if (onCerrar) onCerrar();
    else setMostrarFiltro(false);
  };

  const handleLimpiar = () => {
    setDepartamento('');
    setProvincia('');
    setDistrito('');
    setUsarMiUbicacion(false);
    setRadioKm(5);

    commitChanges(undefined);
    if (onCerrar) onCerrar();
    else setMostrarFiltro(false);
  };

  // Render Modal Mode
  if (onCerrar) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}>
        <div
          ref={modalRef}
          style={{
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '16px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
            width: '100%',
            maxWidth: '400px',
            padding: '1.5rem',
            position: 'relative'
          }}
          className="animate-in zoom-in-95 duration-200"
        >
          <button
            onClick={onCerrar}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)'
            }}
          >
            <FaTimes size={20} />
          </button>

          {/* Content reused */}
          {renderContent()}
        </div>
      </div>
    );
  }

  // Helper to render form content
  function renderContent() {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            margin: 0,
            marginBottom: '0.4rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem'
          }}>
            <IconLocation size={22} color="var(--brand-blue)" />
            Ubicación de búsqueda
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            Encuentra anuncios cerca de ti. Selecciona una zona y ajusta el radio.
          </p>
        </div>

        {/* Visual Radius Display - "Map Simulator" */}
        {(distrito || usarMiUbicacion) && (
          <div style={{
            width: '100%',
            height: '160px',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '12px',
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: `
              linear-gradient(rgba(83,172,197,0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(83,172,197,0.05) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px'
          }}>
            {/* Simulated Map Markers */}
            <div style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              opacity: 0.3,
              pointerEvents: 'none'
            }}>
              {[...Array(6)].map((_, i) => (
                <div key={i} style={{
                  position: 'absolute',
                  left: `${20 + (i * 15) % 70}%`,
                  top: `${10 + (i * 25) % 80}%`,
                  color: 'var(--text-tertiary)'
                }}>
                  <FaMapMarkerAlt size={12} />
                </div>
              ))}
            </div>

            {/* Radius Circle */}
            <div style={{
              width: `${Math.min(140, 40 + (radioKm * 2))}px`,
              height: `${Math.min(140, 40 + (radioKm * 2))}px`,
              borderRadius: '50%',
              backgroundColor: 'rgba(83, 172, 197, 0.15)',
              border: '2px solid var(--brand-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              boxShadow: '0 0 20px rgba(83, 172, 197, 0.2)'
            }}>
              <div style={{
                position: 'absolute',
                top: '-25px',
                backgroundColor: 'var(--brand-blue)',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '10px',
                fontSize: '0.75rem',
                fontWeight: 700,
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                {radioKm} km
              </div>
              <FaMapMarkerAlt size={24} color="var(--brand-blue)" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />
            </div>

            <div style={{
              position: 'absolute',
              bottom: '8px',
              right: '12px',
              fontSize: '0.7rem',
              color: 'var(--text-tertiary)',
              fontWeight: 500,
              backgroundColor: 'var(--bg-primary)',
              padding: '2px 6px',
              borderRadius: '4px',
              opacity: 0.8
            }}>
              Vista de radio aproximado
            </div>
          </div>
        )}

        {/* Opción: Usar mi ubicación */}
        {ubicacionUsuario && (
          <button
            onClick={() => {
              const newValue = !usarMiUbicacion;
              setUsarMiUbicacion(newValue);
              if (newValue) {
                setDepartamento(ubicacionUsuario.departamento);
                setProvincia(ubicacionUsuario.provincia);
                setDistrito(ubicacionUsuario.distrito);
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '1rem',
              borderRadius: '10px',
              cursor: 'pointer',
              border: usarMiUbicacion ? '2px solid var(--brand-blue)' : '1px solid var(--border-color)',
              backgroundColor: usarMiUbicacion ? 'rgba(83, 172, 197, 0.05)' : 'var(--bg-primary)',
              color: usarMiUbicacion ? 'var(--brand-blue)' : 'var(--text-primary)',
              transition: 'all 0.2s',
              textAlign: 'left',
              width: '100%',
              outline: 'none'
            }}
          >
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: usarMiUbicacion ? 'var(--brand-blue)' : 'var(--bg-secondary)',
              color: usarMiUbicacion ? 'white' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <FaMapMarkerAlt size={16} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Usar mi ubicación actual</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>{ubicacionUsuario.distrito}, {ubicacionUsuario.provincia}</div>
            </div>
          </button>
        )}

        {!usarMiUbicacion && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {/* Departamento */}
            <div style={{ position: 'relative' }}>
              <label style={{
                position: 'absolute',
                top: '-8px',
                left: '12px',
                backgroundColor: 'var(--bg-primary)',
                padding: '0 4px',
                fontSize: '0.7rem',
                fontWeight: 700,
                color: 'var(--brand-blue)',
                zIndex: 1
              }}>
                Departamento
              </label>
              <select
                value={departamento}
                onChange={(e) => setDepartamento(e.target.value)}
                style={{
                  width: '100%',
                  padding: '1rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  appearance: 'none',
                  outline: 'none'
                }}
              >
                <option value="">Seleccionar Departamento</option>
                {departamentos.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            {/* Provincia */}
            {departamento && (
              <div style={{ position: 'relative' }}>
                <label style={{
                  position: 'absolute',
                  top: '-8px',
                  left: '12px',
                  backgroundColor: 'var(--bg-primary)',
                  padding: '0 4px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: 'var(--brand-blue)',
                  zIndex: 1
                }}>
                  Provincia
                </label>
                <select
                  value={provincia}
                  onChange={(e) => setProvincia(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    appearance: 'none',
                    outline: 'none'
                  }}
                >
                  <option value="">Seleccionar Provincia</option>
                  {provincias.map(prov => (
                    <option key={prov} value={prov}>{prov}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Distrito */}
            {provincia && (
              <div style={{ position: 'relative' }}>
                <label style={{
                  position: 'absolute',
                  top: '-8px',
                  left: '12px',
                  backgroundColor: 'var(--bg-primary)',
                  padding: '0 4px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: 'var(--brand-blue)',
                  zIndex: 1
                }}>
                  Distrito
                </label>
                <select
                  value={distrito}
                  onChange={(e) => setDistrito(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    appearance: 'none',
                    outline: 'none'
                  }}
                >
                  <option value="">Seleccionar Distrito</option>
                  {distritos.map(dist => (
                    <option key={dist} value={dist}>{dist}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Radio de búsqueda Slider */}
        {(distrito || usarMiUbicacion) && (
          <div style={{ marginTop: '0.5rem' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.75rem'
            }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Radio de búsqueda</span>
              <span style={{
                fontSize: '1.25rem',
                fontWeight: 900,
                color: 'var(--brand-blue)',
                padding: '4px 12px',
                backgroundColor: 'rgba(83, 172, 197, 0.1)',
                borderRadius: '8px'
              }}>{radioKm} km</span>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              value={radioKm}
              onChange={(e) => setRadioKm(Number(e.target.value))}
              style={{
                width: '100%',
                height: '8px',
                borderRadius: '4px',
                accentColor: 'var(--brand-blue)',
                cursor: 'pointer'
              }}
            />
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.75rem',
              color: 'var(--text-tertiary)',
              marginTop: '0.5rem',
              fontWeight: 500
            }}>
              <span>1 km</span>
              <span>50 km</span>
              <span>100 km</span>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <button
            onClick={handleLimpiar}
            style={{
              flex: 1,
              padding: '1rem',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              backgroundColor: 'transparent',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 600,
              transition: 'all 0.2s'
            }}
          >
            Limpiar
          </button>
          <button
            onClick={handleAplicar}
            style={{
              flex: 2,
              padding: '1rem',
              border: 'none',
              borderRadius: '12px',
              backgroundColor: 'var(--brand-blue)',
              color: 'white',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 700,
              boxShadow: '0 4px 12px rgba(83, 172, 197, 0.3)',
              transition: 'all 0.2s'
            }}
          >
            Aplicar Cambios
          </button>
        </div>
      </div>
    );
  }

  const textoFiltro = value
    ? (value.distrito
      ? `${value.distrito}${value.radioKm ? ` (${value.radioKm} km)` : ''}`
      : value.provincia
        ? `${value.provincia}${value.radioKm ? ` (${value.radioKm} km)` : ''}`
        : value.departamento
          ? `${value.departamento}${value.radioKm ? ` (${value.radioKm} km)` : ''}`
          : 'Ubicación')
    : 'Filtrar por ubicación';

  return (
    <div ref={contenedorRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setMostrarFiltro(!mostrarFiltro)}
        aria-label="Filtrar por ubicación"
        aria-expanded={mostrarFiltro}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 0.75rem',
          border: value ? '1px solid var(--text-primary)' : '1px solid var(--border-color)',
          borderRadius: '6px',
          backgroundColor: value ? 'var(--text-primary)' : 'var(--bg-primary)',
          color: value ? 'var(--bg-primary)' : 'var(--text-primary)',
          cursor: 'pointer',
          fontSize: '0.875rem',
          transition: 'all 0.2s',
          whiteSpace: 'nowrap'
        }}
        onMouseEnter={(e) => {
          if (!value) {
            e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
            e.currentTarget.style.borderColor = 'var(--text-secondary)';
          }
        }}
        onMouseLeave={(e) => {
          if (!value) {
            e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
            e.currentTarget.style.borderColor = 'var(--border-color)';
          }
        }}
      >
        <IconLocation size={14} color={value ? 'var(--bg-primary)' : 'var(--text-primary)'} />
        <span>{textoFiltro}</span>
        {value && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleLimpiar();
            }}
            style={{
              marginLeft: '0.25rem',
              padding: '0.125rem',
              border: 'none',
              backgroundColor: 'transparent',
              color: 'var(--bg-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '4px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <FaTimes size={10} />
          </button>
        )}
      </button>

      {mostrarFiltro && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 0.5rem)',
            right: 0,
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            boxShadow: '0 4px 16px var(--shadow)',
            zIndex: 1000,
            minWidth: '280px',
            padding: '1rem',
          }}
        >
          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              margin: 0,
              marginBottom: '0.75rem'
            }}>
              Filtrar por ubicación
            </h3>

            {/* Opción: Usar mi ubicación */}
            {ubicacionUsuario && (
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem',
                borderRadius: '6px',
                cursor: 'pointer',
                marginBottom: '0.75rem',
                backgroundColor: usarMiUbicacion ? 'var(--text-primary)' : 'var(--bg-secondary)',
                color: usarMiUbicacion ? 'var(--bg-primary)' : 'var(--text-primary)',
                transition: 'all 0.2s'
              }}>
                <input
                  type="checkbox"
                  checked={usarMiUbicacion}
                  onChange={(e) => {
                    setUsarMiUbicacion(e.target.checked);
                    if (e.target.checked) {
                      setDepartamento(ubicacionUsuario.departamento);
                      setProvincia(ubicacionUsuario.provincia);
                      setDistrito(ubicacionUsuario.distrito);
                    }
                  }}
                  style={{ margin: 0 }}
                />
                <FaMapMarkerAlt size={12} />
                <span style={{ fontSize: '0.75rem' }}>
                  Usar mi ubicación ({ubicacionUsuario.distrito})
                </span>
              </label>
            )}

            {!usarMiUbicacion && (
              <>
                {/* Departamento */}
                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    color: 'var(--text-secondary)',
                    marginBottom: '0.25rem'
                  }}>
                    Departamento
                  </label>
                  <select
                    value={departamento}
                    onChange={(e) => setDepartamento(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                  >
                    <option value="">Todos los departamentos</option>
                    {departamentos.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                {/* Provincia */}
                {departamento && (
                  <div style={{ marginBottom: '0.75rem' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      color: 'var(--text-secondary)',
                      marginBottom: '0.25rem'
                    }}>
                      Provincia
                    </label>
                    <select
                      value={provincia}
                      onChange={(e) => setProvincia(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        backgroundColor: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        outline: 'none'
                      }}
                    >
                      <option value="">Todas las provincias</option>
                      {provincias.map(prov => (
                        <option key={prov} value={prov}>{prov}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Distrito */}
                {provincia && (
                  <div style={{ marginBottom: '0.75rem' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      color: 'var(--text-secondary)',
                      marginBottom: '0.25rem'
                    }}>
                      Distrito
                    </label>
                    <select
                      value={distrito}
                      onChange={(e) => setDistrito(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        backgroundColor: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        outline: 'none'
                      }}
                    >
                      <option value="">Todos los distritos</option>
                      {distritos.map(dist => (
                        <option key={dist} value={dist}>{dist}</option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            )}

            {/* Radio de búsqueda */}
            {(distrito || usarMiUbicacion) && (
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  marginBottom: '0.25rem'
                }}>
                  Radio de búsqueda: {radioKm} km
                </label>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={radioKm}
                  onChange={(e) => setRadioKm(Number(e.target.value))}
                  style={{
                    width: '100%'
                  }}
                />
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.7rem',
                  color: 'var(--text-tertiary)',
                  marginTop: '0.25rem'
                }}>
                  <span>1 km</span>
                  <span>25 km</span>
                  <span>50 km</span>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handleAplicar}
              style={{
                flex: 1,
                padding: '0.5rem',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: 'var(--text-primary)',
                color: 'var(--bg-primary)',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500,
                transition: 'opacity 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
            >
              Aplicar
            </button>
            <button
              onClick={handleLimpiar}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                backgroundColor: 'transparent',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '0.875rem',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              Limpiar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}











