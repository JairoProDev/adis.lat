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
  onCambiarSeccion?: (seccion: SeccionSidebar) => void; // Callback para sincronizar con navbar
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
  onSuccess,
  onCambiarSeccion
}: ModalNavegacionMobileProps) {
  // TODOS LOS HOOKS DEBEN IR ANTES DEL EARLY RETURN
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [seccionActiva, setSeccionActiva] = useState<SeccionSidebar>(seccionInicial);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  useEffect(() => {
    if (avisoAbierto) {
      setSeccionActiva('aviso');
    }
  }, [avisoAbierto]);

  useEffect(() => {
    if (seccionInicial) {
      setSeccionActiva(seccionInicial);
    }
  }, [seccionInicial]);

  // Solo mostrar en mobile - EARLY RETURN DESPUÉS DE TODOS LOS HOOKS
  if (isDesktop || !abierto) {
    return null;
  }

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
    // Notificar al padre para sincronizar con navbar
    onCambiarSeccion?.(seccion);
  };

  return (
    <>
      {/* Overlay con fondo semitransparente */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          zIndex: 2000,
          pointerEvents: abierto ? 'auto' : 'none',
          opacity: abierto ? 1 : 0,
          transition: 'opacity 0.3s ease'
        }}
        onClick={onCerrar}
      />

      {/* Modal con altura parcial */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          maxHeight: '85vh',
          backgroundColor: 'var(--bg-primary)',
          zIndex: 2001,
          display: 'flex',
          flexDirection: 'column',
          transform: abierto ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          borderRadius: '16px 16px 0 0',
          overflow: 'hidden',
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.15)',
          paddingBottom: '4rem' // Espacio para el navbar permanente
        }}
        onClick={(e) => e.stopPropagation()} // Prevenir cierre al hacer click dentro
      >
        {/* Header con indicador y botón cerrar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-primary)',
            position: 'relative',
            flexShrink: 0
          }}
        >
          {/* Indicador visual superior */}
          <div
            style={{
              position: 'absolute',
              top: '0.5rem',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '36px',
              height: '4px',
              backgroundColor: 'var(--text-tertiary)',
              borderRadius: '2px',
              opacity: 0.3
            }}
          />
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 0 0.5rem', flex: 1 }}>
            {secciones.find(s => s.id === seccionActiva)?.label || 'Navegación'}
          </h2>
          <button
            onClick={onCerrar}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              transition: 'all 0.2s ease',
              flexShrink: 0
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            <IconClose size={20} />
          </button>
        </div>

        {/* Contenido con scroll suave */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            position: 'relative',
            WebkitOverflowScrolling: 'touch',
            minHeight: 0 // Permite que el contenido se comprima si es necesario
          }}
        >
          {seccionActiva === 'aviso' && avisoAbierto && (
            <ModalAviso
              aviso={avisoAbierto}
              onCerrar={onCerrarAviso}
              onAnterior={onAnterior}
              onSiguiente={onSiguiente}
              puedeAnterior={puedeAnterior}
              puedeSiguiente={puedeSiguiente}
              dentroSidebar={true}
            />
          )}

          {seccionActiva === 'mapa' && (
            <MapaInteractivo avisos={[]} onAbrirAviso={() => {}} />
          )}

          {seccionActiva === 'publicar' && (
            <FormularioPublicar
              onPublicar={(aviso) => {
                onPublicar(aviso);
                setSeccionActiva('aviso');
                onCambiarSeccion?.('aviso');
              }}
              onCerrar={() => {
                setSeccionActiva('aviso');
                onCambiarSeccion?.('aviso');
              }}
              onError={onError}
              onSuccess={onSuccess}
              dentroSidebar={true}
            />
          )}

          {seccionActiva === 'chatbot' && (
            <div style={{ width: '100%', height: '100%', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChatbotIA />
            </div>
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

        {/* El navbar ahora está fuera del modal, en NavbarMobile permanente */}
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
        
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}

