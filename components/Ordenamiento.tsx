'use client';

import { FaSortAmountDown, FaSortAmountUp } from 'react-icons/fa';

interface OrdenamientoProps {
  value: 'recientes' | 'antiguos';
  onChange: (value: 'recientes' | 'antiguos') => void;
}

export default function Ordenamiento({ value, onChange }: OrdenamientoProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      fontSize: '0.875rem'
    }}>
      <span style={{ color: 'var(--text-secondary)', marginRight: '0.25rem', fontSize: '0.875rem' }}>Ordenar:</span>
      <button
        onClick={() => onChange('recientes')}
        style={{
          padding: '0.375rem 0.75rem',
          fontSize: '0.875rem',
          borderRadius: '6px',
          border: '1px solid var(--border-color)',
          backgroundColor: value === 'recientes' ? 'var(--text-primary)' : 'var(--bg-primary)',
          color: value === 'recientes' ? 'var(--bg-primary)' : 'var(--text-primary)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          if (value !== 'recientes') {
            e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
          }
        }}
        onMouseLeave={(e) => {
          if (value !== 'recientes') {
            e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
          }
        }}
      >
        <FaSortAmountDown size={14} />
        Más recientes
      </button>
      <button
        onClick={() => onChange('antiguos')}
        style={{
          padding: '0.375rem 0.75rem',
          fontSize: '0.875rem',
          borderRadius: '6px',
          border: '1px solid var(--border-color)',
          backgroundColor: value === 'antiguos' ? 'var(--text-primary)' : 'var(--bg-primary)',
          color: value === 'antiguos' ? 'var(--bg-primary)' : 'var(--text-primary)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          if (value !== 'antiguos') {
            e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
          }
        }}
        onMouseLeave={(e) => {
          if (value !== 'antiguos') {
            e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
          }
        }}
      >
        <FaSortAmountUp size={14} />
        Más antiguos
      </button>
    </div>
  );
}

