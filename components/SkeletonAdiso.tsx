'use client';

import React from 'react';

/**
 * Componente Skeleton para mostrar mientras se cargan los adisos
 * Mejora la UX con placeholders animados
 */
export default function SkeletonAdiso() {
  return (
    <div
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '0.75rem',
        padding: '1rem',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        animation: 'pulse 1.5s ease-in-out infinite'
      }}
    >
      {/* Título skeleton */}
      <div
        style={{
          height: '1.25rem',
          backgroundColor: 'var(--border-color)',
          borderRadius: '0.25rem',
          width: '70%',
          animation: 'shimmer 2s infinite'
        }}
      />
      
      {/* Descripción skeleton */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}
      >
        <div
          style={{
            height: '0.875rem',
            backgroundColor: 'var(--border-color)',
            borderRadius: '0.25rem',
            width: '100%',
            animation: 'shimmer 2s infinite',
            animationDelay: '0.1s'
          }}
        />
        <div
          style={{
            height: '0.875rem',
            backgroundColor: 'var(--border-color)',
            borderRadius: '0.25rem',
            width: '85%',
            animation: 'shimmer 2s infinite',
            animationDelay: '0.2s'
          }}
        />
      </div>
      
      {/* Footer skeleton */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '0.5rem'
        }}
      >
        <div
          style={{
            height: '0.75rem',
            backgroundColor: 'var(--border-color)',
            borderRadius: '0.25rem',
            width: '40%',
            animation: 'shimmer 2s infinite',
            animationDelay: '0.3s'
          }}
        />
        <div
          style={{
            height: '0.75rem',
            backgroundColor: 'var(--border-color)',
            borderRadius: '0.25rem',
            width: '30%',
            animation: 'shimmer 2s infinite',
            animationDelay: '0.4s'
          }}
        />
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.6;
          }
        }
        @keyframes shimmer {
          0% {
            background: linear-gradient(90deg, var(--border-color) 0%, var(--bg-secondary) 50%, var(--border-color) 100%);
            background-size: 200% 100%;
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Componente para mostrar múltiples skeletons en la grilla
 * Optimizado para coincidir con el tamaño de los adisos
 */
export function SkeletonAdisosGrid({ count = 6 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={`skeleton-${index}`}
          style={{
            gridColumn: 'span 1',
            gridRow: 'span 1'
          }}
        >
          <SkeletonAdiso />
        </div>
      ))}
    </>
  );
}

