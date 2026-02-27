'use client';

import React, { useState, useRef, useEffect } from 'react';
import { IconSort, IconSortDown, IconSortUp } from './Icons';
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

  const opcionesOrdenamiento: Array<{ valor: TipoOrdenamiento; labelKey: string; icon: React.ComponentType<{ size?: number; color?: string; className?: string }> }> = [
    { valor: 'recientes', labelKey: 'sort.recent', icon: IconSortDown },
    { valor: 'antiguos', labelKey: 'sort.oldest', icon: IconSortUp },
    { valor: 'titulo-asc', labelKey: 'sort.titleAsc', icon: IconSort },
    { valor: 'titulo-desc', labelKey: 'sort.titleDesc', icon: IconSort },
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
          gap: '0.5rem',
          padding: '0 0.875rem',
          border: 'none',
          borderRadius: '14px',
          backgroundColor: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
          cursor: 'pointer',
          fontSize: '0.85rem',
          fontWeight: 600,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          height: '42px'
        }}
        className="hover:shadow-md hover:-translate-y-0.5"
      >
        <CurrentIcon size={16} aria-hidden="true" className="text-sky-500" />
        <span className="hidden sm:inline">{t(opcionActual.labelKey)}</span>
        <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginLeft: '4px', opacity: 0.5 }}>▼</span>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            backgroundColor: 'var(--bg-primary)',
            border: 'none',
            borderRadius: '16px',
            boxShadow: '0 15px 35px rgba(0,0,0,0.1), 0 5px 15px rgba(0,0,0,0.05)',
            zIndex: 1000,
            minWidth: '200px',
            overflow: 'hidden',
            padding: '4px',
            animation: 'fadeIn 0.2s ease'
          }}
        >
          {opcionesOrdenamiento.map((opcion) => {
            const OptionIcon = opcion.icon;
            const isSelected = valor === opcion.valor;
            return (
              <button
                key={opcion.valor}
                onClick={() => handleSelect(opcion.valor)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  textAlign: 'left',
                  border: 'none',
                  borderRadius: '12px',
                  backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
                  color: isSelected ? 'var(--brand-blue)' : 'var(--text-primary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  fontSize: '0.875rem',
                  fontWeight: isSelected ? 600 : 500,
                  transition: 'all 0.2s',
                  marginBottom: '2px'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  backgroundColor: isSelected ? 'white' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: isSelected ? '0 2px 5px rgba(0,0,0,0.05)' : 'none'
                }}>
                  <OptionIcon size={14} color={isSelected ? 'var(--brand-blue)' : undefined} />
                </div>
                <span>{t(opcion.labelKey)}</span>
                {isSelected && <span style={{ marginLeft: 'auto', color: 'var(--brand-blue)' }}>●</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

