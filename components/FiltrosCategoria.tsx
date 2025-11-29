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

interface FiltrosCategoriaProps {
  categoriaSeleccionada: Categoria | 'todos';
  onChange: (categoria: Categoria | 'todos') => void;
}

const CATEGORIAS: Array<{ value: Categoria | 'todos'; label: string; icon: React.ComponentType<{ size?: number; color?: string }> }> = [
  { value: 'todos', label: 'Todos', icon: IconTodos },
  { value: 'empleos', label: 'Empleos', icon: IconEmpleos },
  { value: 'inmuebles', label: 'Inmuebles', icon: IconInmuebles },
  { value: 'vehiculos', label: 'Vehículos', icon: IconVehiculos },
  { value: 'servicios', label: 'Servicios', icon: IconServicios },
  { value: 'productos', label: 'Productos', icon: IconProductos },
  { value: 'eventos', label: 'Eventos', icon: IconEventos },
  { value: 'negocios', label: 'Negocios', icon: IconNegocios },
  { value: 'comunidad', label: 'Comunidad', icon: IconComunidad },
];

export default function FiltrosCategoria({ categoriaSeleccionada, onChange }: FiltrosCategoriaProps) {
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
            return <IconComponent color={categoriaSeleccionada === cat.value ? 'var(--bg-primary)' : 'var(--text-primary)'} />;
          })()}
          {cat.label}
        </button>
      ))}
    </div>
  );
}

