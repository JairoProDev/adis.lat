'use client';

import { useMediaQuery } from '@/hooks/useMediaQuery';

interface BotonPublicarProps {
  onClick: () => void;
}

export default function BotonPublicar({ onClick }: BotonPublicarProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)');

  return (
    <button
      onClick={onClick}
      style={{
        position: 'fixed',
        bottom: isDesktop ? '2rem' : '1rem',
        ...(isDesktop
          ? { right: '2rem', left: 'auto', transform: 'none', width: 'auto', padding: '0.75rem 1.5rem' }
          : { left: '50%', transform: 'translateX(-50%)', width: 'calc(100% - 2rem)', maxWidth: '400px', padding: '0.875rem' }
        ),
        backgroundColor: 'var(--text-primary)',
        color: 'var(--bg-primary)',
        fontSize: '1rem',
        fontWeight: 600,
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'opacity 0.2s',
        zIndex: 1000,
        boxShadow: '0 4px 12px var(--shadow)',
        border: 'none'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = '0.9';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = '1';
      }}
    >
      Publicar
    </button>
  );
}

