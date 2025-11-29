'use client';

import React, { useState, useEffect } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Aviso } from '@/types';
import { IconAviso, IconMap, IconMegaphone, IconChatbot, IconGratuitos, IconClose } from './Icons';
import ModalAviso from './ModalAviso';
import MapaInteractivo from './MapaInteractivo';
import FormularioPublicar from './FormularioPublicar';
import ChatbotIA from './ChatbotIA';
import AvisosGratuitos from './AvisosGratuitos';

export type SeccionSidebar = 'aviso' | 'mapa' | 'publicar' | 'chatbot' | 'gratuitos';

interface ModalNavegacionMobileProps {
  abierto: boolean;
  onCerrar: () => void;
  seccionInicial?: SeccionSidebar;
  avisoAbierto: Aviso | null;
  onCerrarAviso: () => void;
  onAnterior: () => void;
  onSiguiente: () => void;
  puedeAnterior: boolean;
  puedeSiguiente: boolean;
  onPublicar: (aviso: Aviso) => void;
  onError?: (message: string) => void;
  onSuccess?: (message: string) => void;
}

export default function ModalNavegacionMobile({
  abierto,
  onCerrar,
  seccionInicial = 'aviso',
  avisoAbierto,
  onCerrarAviso,
  onAnterior,
  onSiguiente,
  puedeAnterior,
  puedeSiguiente,
  onPublicar,
  onError,
  onSuccess
}: ModalNavegacionMobileProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [seccionActiva, setSeccionActiva] = useState<SeccionSidebar>(seccionInicial);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  // Solo mostrar en mobile
  if (isDesktop || !abierto) {
    return null;
  }

  useEffect(() => {
    if (avisoAbierto) {
      setSeccionActiva('aviso');
    }
  }, [avisoAbierto]);

  const secciones = [
    { id: 'aviso' as SeccionSidebar, icono: IconAviso, label: 'Aviso' },
    { id: 'mapa' as SeccionSidebar, icono: IconMap, label: 'Mapa' },
    { id: 'publicar' as SeccionSidebar, icono: IconMegaphone, label: 'Publicar' },
    { id: 'chatbot' as SeccionSidebar, icono: IconChatbot, label: 'Chatbot' },
    { id: 'gratuitos' as SeccionSidebar, icono: IconGratuitos, label: 'Gratuitos' }
  ];

  const handleCambiarSeccion = (seccion: SeccionSidebar) => {
    setSeccionActiva(seccion);
    if (seccion === 'publicar') {
      setMostrarFormulario(true);
    } else {
      setMostrarFormulario(false);
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          zIndex: 2000,
          animation: abierto ? 'fadeIn 0.3s ease' : 'none'
        }}
        onClick={onCerrar}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          top: 0,
          backgroundColor: 'var(--bg-primary)',
          zIndex: 2001,
          display: 'flex',
          flexDirection: 'column',
          transform: abierto ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          borderRadius: '16px 16px 0 0',
          overflow: 'hidden'
        }}
      >
        {/* Header con botón cerrar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem',
            borderBottom: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-secondary)'
          }}
        >
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            {secciones.find(s => s.id === seccionActiva)?.label || 'Navegación'}
          </h2>
          <button
            onClick={onCerrar}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: 'var(--bg-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <IconClose size={18} />
          </button>
        </div>

        {/* Contenido */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            position: 'relative',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {seccionActiva === 'aviso' && avisoAbierto && (
            <div style={{ height: '100%', overflowY: 'auto' }}>
              <ModalAviso
                aviso={avisoAbierto}
                onCerrar={onCerrarAviso}
                onAnterior={onAnterior}
                onSiguiente={onSiguiente}
                puedeAnterior={puedeAnterior}
                puedeSiguiente={puedeSiguiente}
                dentroSidebar={false}
              />
            </div>
          )}

          {seccionActiva === 'mapa' && (
            <MapaInteractivo avisos={[]} onAbrirAviso={() => {}} />
          )}

          {seccionActiva === 'publicar' && mostrarFormulario && (
            <div style={{ padding: '1rem', height: '100%', overflowY: 'auto' }}>
              <FormularioPublicar
                onPublicar={(aviso) => {
                  onPublicar(aviso);
                  setMostrarFormulario(false);
                  setSeccionActiva('aviso');
                }}
                onCerrar={() => {
                  setMostrarFormulario(false);
                  setSeccionActiva('aviso');
                }}
                onError={onError}
                onSuccess={onSuccess}
              />
            </div>
          )}

          {seccionActiva === 'chatbot' && (
            <ChatbotIA />
          )}

          {seccionActiva === 'gratuitos' && (
            <AvisosGratuitos />
          )}

          {seccionActiva === 'aviso' && !avisoAbierto && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: 'var(--text-tertiary)',
                fontSize: '0.875rem',
                textAlign: 'center',
                padding: '2rem'
              }}
            >
              Selecciona un aviso para ver los detalles
            </div>
          )}
        </div>

        {/* Navbar inferior */}
        <div
          style={{
            display: 'flex',
            borderTop: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-primary)',
            padding: '0.5rem 0',
            boxShadow: '0 -2px 10px var(--shadow)'
          }}
        >
          {secciones.map((seccion) => {
            const IconComponent = seccion.icono;
            const estaActiva = seccionActiva === seccion.id;
            const esPublicar = seccion.id === 'publicar';
            
            return (
              <button
                key={seccion.id}
                onClick={() => handleCambiarSeccion(seccion.id)}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.5rem',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: estaActiva ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  cursor: 'pointer',
                  fontSize: '0.65rem',
                  fontWeight: estaActiva ? 600 : 400,
                  transition: 'all 0.2s',
                  position: 'relative'
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
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}

