'use client';

import React from 'react';

interface LoadingSpinnerProps {
  size?: number;
  color?: string;
}

export default function LoadingSpinner({ size = 24, color = 'var(--text-primary)' }: LoadingSpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Cargando"
      style={{
        width: size,
        height: size,
        border: `2px solid ${color}20`,
        borderTop: `2px solid ${color}`,
        borderRadius: '50%',
        animation: 'spin 0.6s linear infinite',
        display: 'inline-block'
      }}
    />
  );
}









