'use client';

import React, { useState } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Aviso } from '@/types';
import { IconAviso, IconMap, IconMegaphone, IconChatbot, IconGratuitos, IconMinimize, IconExpand } from './Icons';
import ModalAviso from './ModalAviso';
import MapaInteractivo from './MapaInteractivo';
import FormularioPublicar from './FormularioPublicar';
import ChatbotIA from './ChatbotIA';
import AvisosGratuitos from './AvisosGratuitos';

export type SeccionSidebar = 'aviso' | 'mapa' | 'publicar' | 'chatbot' | 'gratuitos';

interface SidebarDesktopProps {
  avisoAbierto: Aviso | null;
  onCerrarAviso: () => void;
  onAnterior: () => void;
  onSiguiente: () => void;
  puedeAnterior: boolean;
  puedeSiguiente: boolean;
  onPublicar: (aviso: Aviso) => void;
  onError?: (message: string) => void;
  onSuccess?: (message: string) => void;
  seccionInicial?: SeccionSidebar; // Nueva prop para controlar la sección inicial
}

export default function SidebarDesktop({
  avisoAbierto,
  onCerrarAviso,
  onAnterior,
  onSiguiente,
  puedeAnterior,
  puedeSiguiente,
  onPublicar,
  onError,
  onSuccess,
  seccionInicial
}: SidebarDesktopProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [seccionActiva, setSeccionActiva] = useState<SeccionSidebar>(seccionInicial || 'aviso');
  const [minimizado, setMinimizado] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  // Si hay aviso abierto, mostrar sección de aviso automáticamente
  React.useEffect(() => {
    if (avisoAbierto) {
      setSeccionActiva('aviso');
    }
  }, [avisoAbierto]);

  // Si se cambia la sección inicial desde fuera, actualizar
  React.useEffect(() => {
    if (seccionInicial) {
      setSeccionActiva(seccionInicial);
      if (seccionInicial === 'publicar') {
        setMostrarFormulario(true);
      } else {
        setMostrarFormulario(false);
      }
    }
  }, [seccionInicial]);

  // En mobile, no mostrar este componente (se maneja diferente)
  if (!isDesktop) {
    return null;
  }

  const secciones = [
    { id: 'aviso' as SeccionSidebar, icono: IconAviso, label: 'Aviso' },
    { id: 'mapa' as SeccionSidebar, icono: IconMap, label: 'Mapa' },
    { id: 'publicar' as SeccionSidebar, icono: IconMegaphone, label: 'Publicar' },
    { id: 'chatbot' as SeccionSidebar, icono: IconChatbot, label: 'Chatbot' },
    { id: 'gratuitos' as SeccionSidebar, icono: IconGratuitos, label: 'Gratuitos' }
  ];

  const anchoSidebar = minimizado ? 60 : 420;

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: `${anchoSidebar}px`,
          backgroundColor: 'var(--bg-primary)',
          borderLeft: '1px solid var(--border-color)',
          boxShadow: '-4px 0 20px var(--shadow)',
          zIndex: 1500,
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.3s ease'
        }}
      >
        {/* Header con tabs */}
        {!minimizado && (
          <div
            style={{
              display: 'flex',
              borderBottom: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-secondary)',
              overflowX: 'auto',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            <style jsx>{`
              div::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            {secciones.map((seccion) => {
              const IconComponent = seccion.icono;
              const estaActiva = seccionActiva === seccion.id;
              const esPublicar = seccion.id === 'publicar';
              return (
                <button
                  key={seccion.id}
                  onClick={() => {
                    setSeccionActiva(seccion.id);
                    if (seccion.id === 'publicar') {
                      setMostrarFormulario(true);
                    } else {
                      setMostrarFormulario(false);
                    }
                  }}
                  style={{
                    flex: esPublicar ? 1.2 : 1,
                    minWidth: '80px',
                    padding: esPublicar ? '0.875rem 0.5rem' : '0.75rem 0.5rem',
                    border: 'none',
                    backgroundColor: esPublicar 
                      ? (estaActiva ? 'var(--color-secondary)' : 'var(--color-secondary)')
                      : (estaActiva ? 'var(--bg-primary)' : 'transparent'),
                    color: esPublicar 
                      ? 'var(--text-primary)'
                      : (estaActiva ? 'var(--text-primary)' : 'var(--text-secondary)'),
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontSize: esPublicar ? '0.75rem' : '0.7rem',
                    fontWeight: esPublicar ? 700 : (estaActiva ? 600 : 400),
                    transition: 'all 0.2s',
                    borderBottom: estaActiva ? `2px solid var(--text-primary)` : '2px solid transparent',
                    position: 'relative',
                    borderRadius: esPublicar ? '6px' : '0',
                    margin: esPublicar ? '0 0.25rem' : '0',
                    boxShadow: esPublicar ? '0 2px 8px rgba(0, 0, 0, 0.1)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (esPublicar) {
                      e.currentTarget.style.opacity = '0.9';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    } else if (!estaActiva) {
                      e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (esPublicar) {
                      e.currentTarget.style.opacity = '1';
                      e.currentTarget.style.transform = 'translateY(0)';
                    } else if (!estaActiva) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <IconComponent size={18} />
                  <span>{seccion.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Botón minimizar/expandir */}
        <button
          onClick={() => setMinimizado(!minimizado)}
          style={{
            position: 'absolute',
            top: '0.5rem',
            left: minimizado ? '50%' : '-1.5rem',
            transform: minimizado ? 'translateX(-50%)' : 'none',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10,
            boxShadow: '0 2px 8px var(--shadow)',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
          }}
        >
          {minimizado ? <IconExpand size={14} /> : <IconMinimize size={14} />}
        </button>

        {/* Contenido según sección activa */}
        {!minimizado && (
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              position: 'relative'
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
                  dentroSidebar={true}
                />
              </div>
            )}

            {seccionActiva === 'mapa' && (
              <MapaInteractivo avisos={[]} onAbrirAviso={() => {}} />
            )}

            {seccionActiva === 'publicar' && (
              <FormularioPublicar
                onPublicar={(aviso) => {
                  onPublicar(aviso);
                }}
                onCerrar={() => {
                  setSeccionActiva('aviso');
                }}
                onError={onError}
                onSuccess={onSuccess}
                dentroSidebar={true}
              />
            )}

            {seccionActiva === 'chatbot' && (
              <ChatbotIA />
            )}

            {seccionActiva === 'gratuitos' && (
              <AvisosGratuitos />
            )}

            {/* Estado vacío cuando no hay contenido */}
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
        )}

        {/* Estado minimizado */}
        {minimizado && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '3.5rem 0 1rem 0',
              gap: '1rem'
            }}
          >
            {secciones.map((seccion) => {
              const IconComponent = seccion.icono;
              const estaActiva = seccionActiva === seccion.id;
              return (
                <button
                  key={seccion.id}
                    onClick={() => {
                      setMinimizado(false);
                      setSeccionActiva(seccion.id);
                      if (seccion.id === 'publicar') {
                        setMostrarFormulario(true);
                      } else {
                        setMostrarFormulario(false);
                      }
                    }}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: estaActiva ? 'var(--text-primary)' : 'var(--bg-secondary)',
                    color: estaActiva ? 'var(--bg-primary)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!estaActiva) {
                      e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!estaActiva) {
                      e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                    }
                  }}
                  title={seccion.label}
                >
                  <IconComponent size={18} />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

