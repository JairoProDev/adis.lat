'use client';

import React from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { SeccionSidebar } from './SidebarDesktop';
import { IconAdiso, IconMap, IconMegaphone, IconChatbot, IconGratuitos, IconStore } from './Icons';

interface NavbarMobileProps {
  seccionActiva: SeccionSidebar | null;
  onCambiarSeccion: (seccion: SeccionSidebar) => void;
  tieneAdisoAbierto: boolean;
}

export default function NavbarMobile({
  seccionActiva,
  onCambiarSeccion,
  tieneAdisoAbierto
}: NavbarMobileProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)');

  // Solo mostrar en mobile
  if (isDesktop) {
    return null;
  }

  const secciones = [
    { id: 'adiso' as SeccionSidebar, icono: IconAdiso, label: 'Adiso' },
    { id: 'mapa' as SeccionSidebar, icono: IconMap, label: 'Mapa' },
    { id: 'publicar' as SeccionSidebar, icono: IconMegaphone, label: 'Publicar' },
    { id: 'negocio' as SeccionSidebar, icono: IconStore, label: 'Negocio' },
    { id: 'gratuitos' as SeccionSidebar, icono: IconGratuitos, label: 'Gratuitos' }
  ];

  return (
    <>
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      <nav
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '4rem',
          backgroundColor: 'var(--bg-primary)',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          padding: '0.5rem 0',
          boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.05)',
          zIndex: 1500,
          animation: 'fadeIn 0.3s ease-out'
        }}
      >
        {secciones.map((seccion) => {
          const IconComponent = seccion.icono;
          const estaActiva = seccionActiva !== null && seccionActiva === seccion.id;
          const esPublicar = seccion.id === 'publicar';
          const tieneNotificacion = seccion.id === 'adiso' && tieneAdisoAbierto && !estaActiva;

          return (
            <button
              key={seccion.id}
              onClick={() => {
                if (seccion.id === 'negocio') {
                  window.location.href = '/mi-negocio';
                  return;
                }
                onCambiarSeccion(seccion.id);
              }}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.25rem',
                padding: '0.5rem',
                border: 'none',
                backgroundColor: 'transparent',
                color: estaActiva ? 'var(--text-primary)' : 'var(--text-tertiary)',
                cursor: 'pointer',
                fontSize: '0.65rem',
                fontWeight: estaActiva ? 600 : 400,
                transition: 'all 0.2s',
                position: 'relative',
                minHeight: '60px'
              }}
              onTouchStart={(e) => {
                e.currentTarget.style.opacity = '0.7';
              }}
              onTouchEnd={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
            >
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <IconComponent size={esPublicar ? 22 : 20} />
                {esPublicar && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-secondary)',
                      border: '2px solid var(--bg-primary)'
                    }}
                  />
                )}
                {tieneNotificacion && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--text-primary)',
                      border: '2px solid var(--bg-primary)'
                    }}
                  />
                )}
              </div>
              <span>{seccion.label}</span>
              {estaActiva && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '0',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '30px',
                    height: '3px',
                    backgroundColor: 'var(--text-primary)',
                    borderRadius: '2px 2px 0 0'
                  }}
                />
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
}
