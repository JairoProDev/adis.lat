'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FaSort, FaSortAmountDown, FaSortAmountUp } from 'react-icons/fa';
import { useTranslation } from '@/hooks/useTranslation';

export type TipoOrdenamiento = 'recientes' | 'antiguos' | 'titulo-asc' | 'titulo-desc';

interface OrdenamientoProps {
  valor: TipoOrdenamiento;
  onChange: (valor: TipoOrdenamiento) => void;
}

export default function Ordenamiento({ valor, onChange }: OrdenamientoProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const opcionesOrdenamiento: Array<{ valor: TipoOrdenamiento; labelKey: string; icon: React.ComponentType<{ size?: number }> }> = [
    { valor: 'recientes', labelKey: 'sort.recent', icon: FaSortAmountDown },
    { valor: 'antiguos', labelKey: 'sort.oldest', icon: FaSortAmountUp },
    { valor: 'titulo-asc', labelKey: 'sort.titleAsc', icon: FaSort },
    { valor: 'titulo-desc', labelKey: 'sort.titleDesc', icon: FaSort },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const opcionActual = opcionesOrdenamiento.find(opt => opt.valor === valor) || opcionesOrdenamiento[0];
  const CurrentIcon = opcionActual.icon;

  const handleSelect = (nuevoValor: TipoOrdenamiento) => {
    onChange(nuevoValor);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={t('sort.label')}
        aria-expanded={isOpen}
        aria-haspopup="true"
        title={t(opcionActual.labelKey)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.4rem 0.6rem',
          border: '1px solid var(--border-color)',
          borderRadius: '6px',
          backgroundColor: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          fontSize: '0.8rem',
          transition: 'all 0.2s',
          height: '32px'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
        }}
      >
        <CurrentIcon size={14} aria-hidden="true" />
        <span className="hidden sm:inline">{t(opcionActual.labelKey)}</span>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginLeft: '2px' }}>▼</span>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '0.5rem',
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            boxShadow: '0 4px 12px var(--shadow)',
            zIndex: 1000,
            minWidth: '180px',
            overflow: 'hidden',
          }}
        >
          {opcionesOrdenamiento.map((opcion) => {
            const OptionIcon = opcion.icon;
            return (
              <button
                key={opcion.valor}
                onClick={() => handleSelect(opcion.valor)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  textAlign: 'left',
                  border: 'none',
                  backgroundColor: valor === opcion.valor ? 'var(--text-primary)' : 'transparent',
                  color: valor === opcion.valor ? 'var(--bg-primary)' : 'var(--text-primary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  fontSize: '0.875rem',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (valor !== opcion.valor) {
                    e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (valor !== opcion.valor) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <OptionIcon size={14} aria-hidden="true" />
                <span>{t(opcion.labelKey)}</span>
                {valor === opcion.valor && <span style={{ marginLeft: 'auto' }}>✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

