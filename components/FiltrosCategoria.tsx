'use client';

import React from 'react';
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
import { useTranslation } from '@/hooks/useTranslation';

interface FiltrosCategoriaProps {
  categoriaSeleccionada: Categoria | 'todos';
  onChange: (categoria: Categoria | 'todos') => void;
}

export default function FiltrosCategoria({ categoriaSeleccionada, onChange }: FiltrosCategoriaProps) {
  const { t } = useTranslation();
  
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
  return (
    <div style={{
      display: 'flex',
      gap: '0.5rem',
      flexWrap: 'wrap',
      overflowX: 'auto',
      paddingBottom: '0.5rem',
      WebkitOverflowScrolling: 'touch'
    }}>
      {CATEGORIAS.map((cat) => (
        <button
          key={cat.value}
          onClick={() => onChange(cat.value)}
          aria-label={`${t('common.filter')} ${t(cat.labelKey)}`}
          aria-pressed={categoriaSeleccionada === cat.value}
          style={{
            padding: '0.5rem 1rem',
            fontSize: '0.875rem',
            borderRadius: '20px',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            backgroundColor: categoriaSeleccionada === cat.value
              ? 'var(--text-primary)'
              : 'var(--bg-primary)',
            color: categoriaSeleccionada === cat.value
              ? 'var(--bg-primary)'
              : 'var(--text-primary)',
            cursor: 'pointer',
            transition: 'all 0.2s',
            whiteSpace: 'nowrap'
          }}
          onMouseEnter={(e) => {
            if (categoriaSeleccionada !== cat.value) {
              e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
            }
          }}
          onMouseLeave={(e) => {
            if (categoriaSeleccionada !== cat.value) {
              e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
            }
          }}
        >
          {(() => {
            const IconComponent = cat.icon;
            return <IconComponent aria-hidden="true" color={categoriaSeleccionada === cat.value ? 'var(--bg-primary)' : 'var(--text-primary)'} />;
          })()}
          {t(cat.labelKey)}
        </button>
      ))}
    </div>
  );
}

