'use client';

import React from 'react';
import { FaSort, FaSortAmountDown, FaSortAmountUp } from 'react-icons/fa';
import { useTranslation } from '@/hooks/useTranslation';

export type TipoOrdenamiento = 'recientes' | 'antiguos' | 'titulo-asc' | 'titulo-desc';

interface OrdenamientoProps {
  valor: TipoOrdenamiento;
  onChange: (valor: TipoOrdenamiento) => void;
}

export default function Ordenamiento({ valor, onChange }: OrdenamientoProps) {
  const { t } = useTranslation();
  
  const opcionesOrdenamiento: Array<{ valor: TipoOrdenamiento; labelKey: string; icon: React.ComponentType<{ size?: number }> }> = [
    { valor: 'recientes', labelKey: 'sort.recent', icon: FaSortAmountDown },
    { valor: 'antiguos', labelKey: 'sort.oldest', icon: FaSortAmountUp },
    { valor: 'titulo-asc', labelKey: 'sort.titleAsc', icon: FaSort },
    { valor: 'titulo-desc', labelKey: 'sort.titleDesc', icon: FaSort },
  ];

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      flexWrap: 'wrap'
    }}>
      <span style={{
        fontSize: '0.875rem',
        color: 'var(--text-secondary)',
        fontWeight: 500
      }}>
        {t('sort.label')}
      </span>
      <div style={{
        display: 'flex',
        gap: '0.25rem',
        flexWrap: 'wrap'
      }}>
        {opcionesOrdenamiento.map((opcion) => {
          const Icon = opcion.icon;
          const estaSeleccionado = valor === opcion.valor;
          
          return (
            <button
              key={opcion.valor}
              onClick={() => onChange(opcion.valor)}
              aria-label={`${t('sort.label')} ${t(opcion.labelKey)}`}
              aria-pressed={estaSeleccionado}
              style={{
                padding: '0.5rem 0.75rem',
                border: `1px solid ${estaSeleccionado ? 'var(--text-primary)' : 'var(--border-color)'}`,
                borderRadius: '6px',
                backgroundColor: estaSeleccionado ? 'var(--text-primary)' : 'var(--bg-primary)',
                color: estaSeleccionado ? 'var(--bg-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: estaSeleccionado ? 600 : 400,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (!estaSeleccionado) {
                  e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                  e.currentTarget.style.borderColor = 'var(--text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!estaSeleccionado) {
                  e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                }
              }}
            >
              <Icon size={14} aria-hidden="true" />
              {t(opcion.labelKey)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

