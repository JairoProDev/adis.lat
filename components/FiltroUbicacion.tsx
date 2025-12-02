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
  ubicacionUsuario?: UbicacionDetallada;
}

export default function FiltroUbicacion({ value, onChange, ubicacionUsuario }: FiltroUbicacionProps) {
  const [mostrarFiltro, setMostrarFiltro] = useState(false);
  const [departamento, setDepartamento] = useState(value?.departamento || '');
  const [provincia, setProvincia] = useState(value?.provincia || '');
  const [distrito, setDistrito] = useState(value?.distrito || '');
  const [radioKm, setRadioKm] = useState(value?.radioKm || 5);
  const [usarMiUbicacion, setUsarMiUbicacion] = useState(false);
  const contenedorRef = useRef<HTMLDivElement>(null);

  const departamentos = getDepartamentos();
  const provincias = departamento ? getProvincias(departamento) : [];
  const distritos = (departamento && provincia) ? getDistritos(departamento, provincia) : [];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contenedorRef.current && !contenedorRef.current.contains(event.target as Node)) {
        setMostrarFiltro(false);
      }
    };

    if (mostrarFiltro) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mostrarFiltro]);

  // Resetear provincia y distrito cuando cambia el departamento
  useEffect(() => {
    if (departamento && !provincias.includes(provincia)) {
      setProvincia('');
      setDistrito('');
    }
  }, [departamento, provincia, provincias]);

  // Resetear distrito cuando cambia la provincia
  useEffect(() => {
    if (provincia && !distritos.includes(distrito)) {
      setDistrito('');
    }
  }, [provincia, distrito, distritos]);

  const handleAplicar = () => {
    if (usarMiUbicacion && ubicacionUsuario) {
      onChange({
        distrito: ubicacionUsuario.distrito,
        provincia: ubicacionUsuario.provincia,
        departamento: ubicacionUsuario.departamento,
        radioKm: radioKm
      });
    } else if (distrito) {
      onChange({
        distrito,
        provincia,
        departamento,
        radioKm: radioKm
      });
    } else if (provincia) {
      onChange({
        provincia,
        departamento,
        radioKm: radioKm
      });
    } else if (departamento) {
      onChange({
        departamento,
        radioKm: radioKm
      });
    } else {
      onChange(undefined);
    }
    setMostrarFiltro(false);
  };

  const handleLimpiar = () => {
    setDepartamento('');
    setProvincia('');
    setDistrito('');
    setUsarMiUbicacion(false);
    setRadioKm(5);
    onChange(undefined);
    setMostrarFiltro(false);
  };

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




