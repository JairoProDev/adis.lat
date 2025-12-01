'use client';

import { useState, useRef, useEffect } from 'react';
import { IconSearch } from './Icons';
import { useTranslation } from '@/hooks/useTranslation';
import { Categoria } from '@/types';
import { 
  IconTodos, 
  IconEmpleos, 
  IconInmuebles, 
  IconVehiculos, 
  IconServicios, 
  IconProductos, 
  IconEventos, 
  IconNegocios, 
  IconComunidad 
} from './Icons';

interface BuscadorProps {
  value: string;
  onChange: (value: string) => void;
  categoriaSeleccionada?: Categoria | 'todos';
  onCategoriaChange?: (categoria: Categoria | 'todos') => void;
}

export default function Buscador({ value, onChange, categoriaSeleccionada = 'todos', onCategoriaChange }: BuscadorProps) {
  const { t } = useTranslation();
  const [mostrarCategorias, setMostrarCategorias] = useState(false);
  const contenedorRef = useRef<HTMLDivElement>(null);
  const categoriasRef = useRef<HTMLDivElement>(null);

  const CATEGORIAS: Array<{ value: Categoria | 'todos'; labelKey: string; icon: React.ComponentType<{ size?: number; color?: string }> }> = [
    { value: 'todos', labelKey: 'categories.all', icon: IconTodos },
    { value: 'empleos', labelKey: 'categories.empleos', icon: IconEmpleos },
    { value: 'inmuebles', labelKey: 'categories.inmuebles', icon: IconInmuebles },
    { value: 'vehiculos', labelKey: 'categories.vehiculos', icon: IconVehiculos },
    { value: 'servicios', labelKey: 'categories.servicios', icon: IconServicios },
    { value: 'productos', labelKey: 'categories.productos', icon: IconProductos },
    { value: 'eventos', labelKey: 'categories.eventos', icon: IconEventos },
    { value: 'negocios', labelKey: 'categories.negocios', icon: IconNegocios },
    { value: 'comunidad', labelKey: 'categories.comunidad', icon: IconComunidad },
  ];

  const categoriaActual = CATEGORIAS.find(cat => cat.value === categoriaSeleccionada) || CATEGORIAS[0];
  const CategoriaIcon = categoriaActual.icon;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        contenedorRef.current && 
        categoriasRef.current &&
        !contenedorRef.current.contains(event.target as Node) &&
        !categoriasRef.current.contains(event.target as Node)
      ) {
        setMostrarCategorias(false);
      }
    };

    if (mostrarCategorias) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mostrarCategorias]);

  const handleCategoriaSelect = (categoria: Categoria | 'todos') => {
    onCategoriaChange?.(categoria);
    setMostrarCategorias(false);
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {/* Botón de categoría */}
        <div ref={contenedorRef} style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={() => setMostrarCategorias(!mostrarCategorias)}
            aria-label="Seleccionar categoría"
            aria-expanded={mostrarCategorias}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              backgroundColor: categoriaSeleccionada !== 'todos' ? 'var(--text-primary)' : 'var(--bg-primary)',
              color: categoriaSeleccionada !== 'todos' ? 'var(--bg-primary)' : 'var(--text-primary)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--text-secondary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-color)';
            }}
          >
            <CategoriaIcon size={18} color={categoriaSeleccionada !== 'todos' ? 'var(--bg-primary)' : 'var(--text-primary)'} />
            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
              {t(categoriaActual.labelKey)}
            </span>
            <span style={{ fontSize: '0.75rem', color: categoriaSeleccionada !== 'todos' ? 'var(--bg-primary)' : 'var(--text-tertiary)' }}>▼</span>
          </button>
        </div>

        {/* Input de búsqueda */}
        <div style={{ position: 'relative', flex: 1 }}>
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-tertiary)',
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <IconSearch />
          </div>
          <input
            type="search"
            placeholder={t('search.placeholder')}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            aria-label={t('search.label')}
            style={{
              width: '100%',
              padding: '0.75rem 1rem 0.75rem 2.5rem',
              fontSize: '1rem',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--text-secondary)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--border-color)';
            }}
          />
        </div>
      </div>

      {/* Dropdown de categorías horizontal */}
      {mostrarCategorias && (
        <div
          ref={categoriasRef}
          style={{
            position: 'absolute',
            top: 'calc(100% + 0.5rem)',
            left: 0,
            right: 0,
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            boxShadow: '0 4px 16px var(--shadow)',
            zIndex: 1000,
            padding: '1rem',
            maxHeight: '200px',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: '0.75rem',
              overflowX: 'auto',
              overflowY: 'hidden',
              paddingBottom: '0.5rem',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'thin',
            }}
          >
            {CATEGORIAS.map((cat) => {
              const CatIcon = cat.icon;
              const estaSeleccionada = categoriaSeleccionada === cat.value;
              
              return (
                <button
                  key={cat.value}
                  onClick={() => handleCategoriaSelect(cat.value)}
                  aria-label={t(cat.labelKey)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    minWidth: '80px',
                    border: `2px solid ${estaSeleccionada ? 'var(--text-primary)' : 'var(--border-color)'}`,
                    borderRadius: '8px',
                    backgroundColor: estaSeleccionada ? 'var(--text-primary)' : 'var(--bg-secondary)',
                    color: estaSeleccionada ? 'var(--bg-primary)' : 'var(--text-primary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    if (!estaSeleccionada) {
                      e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                      e.currentTarget.style.borderColor = 'var(--text-secondary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!estaSeleccionada) {
                      e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                    }
                  }}
                >
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: estaSeleccionada ? 'var(--bg-primary)' : 'var(--bg-primary)',
                      borderRadius: '8px',
                    }}
                  >
                    <CatIcon 
                      size={24} 
                      color={estaSeleccionada ? 'var(--bg-primary)' : 'var(--text-primary)'} 
                    />
                  </div>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: estaSeleccionada ? 600 : 500,
                      textAlign: 'center',
                      lineHeight: 1.2,
                    }}
                  >
                    {t(cat.labelKey)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

