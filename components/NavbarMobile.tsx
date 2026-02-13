'use client';

import React from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { SeccionSidebar } from './SidebarDesktop';
import {
  IconAdiso,
  IconMap,
  IconMegaphone,
  IconChatbot,
  IconGratuitos,
  IconStore,
  IconGlobe,
  IconRobot,
  IconSearch
} from './Icons';

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

  // Checking current path safely
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';

  // Solo mostrar en mobile
  if (isDesktop) {
    return null;
  }

  const secciones = [
    { id: 'feed', icono: IconGlobe, label: 'Feed', href: '/feed' },
    { id: 'adiso', icono: IconSearch, label: 'Buscar', href: '/' }, // 'adiso' usually maps to '/' home
    { id: 'publicar', icono: IconMegaphone, label: 'Publicar' },
    { id: 'mapa', icono: IconMap, label: 'Mapa' },
    { id: 'chatbot', icono: IconRobot, label: 'Asistente', href: '/chat' },
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
          const isLink = !!seccion.href;
          const isPathActive = isLink && seccion.href !== '/' && pathname.startsWith(seccion.href!);
          const isHomeActive = seccion.href === '/' && pathname === '/' && seccionActiva !== 'mapa' && seccionActiva !== 'publicar';

          const estaActiva = (seccion.id === seccionActiva) || isPathActive || isHomeActive;

          const esPublicar = seccion.id === 'publicar';
          const tieneNotificacion = seccion.id === 'adiso' && tieneAdisoAbierto && !estaActiva;

          return (
            <button
              key={seccion.id}
              onClick={() => {
                if (seccion.href) {
                  // If we are already on the page, maybe reset state?
                  if (pathname === seccion.href) {
                    if (onCambiarSeccion && seccion.id === 'adiso') onCambiarSeccion('adiso' as SeccionSidebar);
                    return;
                  }
                  window.location.href = seccion.href;
                } else {
                  onCambiarSeccion(seccion.id as SeccionSidebar);
                }
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
                color: estaActiva ? 'var(--brand-blue)' : 'var(--text-tertiary)',
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
                    backgroundColor: 'var(--brand-blue)',
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
