'use client';

import React, { useState } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Adiso } from '@/types';
import { IconAdiso, IconMap, IconMegaphone, IconChatbot, IconGratuitos, IconMinimize, IconExpand } from './Icons';
import ModalAdiso from './ModalAdiso';
import MapaInteractivo from './MapaInteractivo';
import FormularioPublicar from './FormularioPublicar';
import ChatbotIA from './ChatbotIANew';
import AdisosGratuitos from './AdisosGratuitos';

export type SeccionSidebar = 'adiso' | 'mapa' | 'publicar' | 'chatbot' | 'gratuitos';

interface SidebarDesktopProps {
  adisoAbierto: Adiso | null;
  onCerrarAdiso: () => void;
  onAnterior: () => void;
  onSiguiente: () => void;
  puedeAnterior: boolean;
  puedeSiguiente: boolean;
  onPublicar: (adiso: Adiso) => void;
  onError?: (message: string) => void;
  onSuccess?: (message: string) => void;
  seccionInicial?: SeccionSidebar; // Nueva prop para controlar la sección inicial
  onMinimizadoChange?: (minimizado: boolean) => void; // Callback para notificar cambios de estado minimizado
  todosLosAdisos?: Adiso[]; // Todos los adisos para mostrar en la sección de gratuitos
}

export default function SidebarDesktop({
  adisoAbierto,
  onCerrarAdiso,
  onAnterior,
  onSiguiente,
  puedeAnterior,
  puedeSiguiente,
  onPublicar,
  onError,
  onSuccess,
  seccionInicial,
  onMinimizadoChange,
  todosLosAdisos = []
}: SidebarDesktopProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [seccionActiva, setSeccionActiva] = useState<SeccionSidebar>(seccionInicial || 'adiso');
  const [minimizado, setMinimizado] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [tooltipHovered, setTooltipHovered] = useState<SeccionSidebar | null>(null);

  // Si hay adiso abierto, mostrar sección de adiso automáticamente y expandir sidebar si está minimizado
  React.useEffect(() => {
    if (adisoAbierto) {
      setSeccionActiva('adiso');
      // Si el sidebar está minimizado, expandirlo automáticamente para mostrar el adiso
      setMinimizado(prev => prev ? false : prev);
    }
  }, [adisoAbierto]);

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
        { id: 'adiso' as SeccionSidebar, icono: IconAdiso, label: 'Adiso', descripcion: 'Ver detalles del adiso seleccionado' },
        { id: 'mapa' as SeccionSidebar, icono: IconMap, label: 'Mapa', descripcion: 'Explorar adisos en el mapa interactivo' },
        { id: 'publicar' as SeccionSidebar, icono: IconMegaphone, label: 'Publicar', descripcion: 'Crear y publicar un nuevo adiso' },
        { id: 'chatbot' as SeccionSidebar, icono: IconChatbot, label: 'Chatbot', descripcion: 'Asistente de búsqueda inteligente (próximamente)' },
        { id: 'gratuitos' as SeccionSidebar, icono: IconGratuitos, label: 'Gratuitos', descripcion: 'Ver y publicar adisos gratuitos' }
      ];

  const anchoSidebar = minimizado ? 60 : 420;

      return (
        <>
          <style jsx global>{`
            @keyframes fadeInTooltipDown {
              from {
                opacity: 0;
                transform: translateX(-50%) translateY(-5px);
              }
              to {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
              }
            }
            @keyframes fadeInTooltipLeft {
              from {
                opacity: 0;
                transform: translateY(-50%) translateX(5px);
              }
              to {
                opacity: 1;
                transform: translateY(-50%) translateX(0);
              }
            }
            .sidebar-tabs-scroll::-webkit-scrollbar {
              display: none;
            }
          `}</style>
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
            className="sidebar-tabs-scroll"
            style={{
              display: 'flex',
              borderBottom: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-secondary)',
              overflowX: 'auto',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            {secciones.map((seccion) => {
              const IconComponent = seccion.icono;
              const estaActiva = seccionActiva === seccion.id;
              const esPublicar = seccion.id === 'publicar';
              const mostrarTooltip = tooltipHovered === seccion.id;
              return (
                <div
                  key={seccion.id}
                  style={{ position: 'relative', flex: esPublicar ? 1.2 : 1 }}
                  onMouseEnter={() => setTooltipHovered(seccion.id)}
                  onMouseLeave={() => setTooltipHovered(null)}
                >
                  <button
                    onClick={() => {
                      setSeccionActiva(seccion.id);
                      if (seccion.id === 'publicar') {
                        setMostrarFormulario(true);
                      } else {
                        setMostrarFormulario(false);
                      }
                    }}
                    style={{
                      width: '100%',
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
                  
                  {/* Tooltip profesional - hacia abajo cuando sidebar expandido */}
                  {mostrarTooltip && !minimizado && (
                    <div
                      style={{
                        position: 'absolute',
                        left: '50%',
                        top: 'calc(100% + 0.75rem)',
                        transform: 'translateX(-50%)',
                        backgroundColor: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        padding: '0.625rem 0.875rem',
                        borderRadius: '8px',
                        fontSize: '0.8125rem',
                        fontWeight: 500,
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        border: '1px solid var(--border-color)',
                        zIndex: 2000,
                        pointerEvents: 'none',
                        animation: 'fadeInTooltipDown 0.2s ease-out',
                        maxWidth: '300px',
                        minWidth: '250px',
                        width: 'max-content',
                        lineHeight: 1.5,
                        whiteSpace: 'normal',
                        textAlign: 'center'
                      }}
                    >
                      <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                        {seccion.label}
                      </div>
                      <div style={{ 
                        fontSize: '0.75rem', 
                        color: 'var(--text-secondary)',
                        fontWeight: 400,
                        lineHeight: 1.5,
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word'
                      }}>
                        {seccion.descripcion}
                      </div>
                      {/* Flecha del tooltip apuntando hacia arriba */}
                      <div
                        style={{
                          position: 'absolute',
                          left: '50%',
                          top: '-6px',
                          transform: 'translateX(-50%)',
                          width: 0,
                          height: 0,
                          borderLeft: '6px solid transparent',
                          borderRight: '6px solid transparent',
                          borderBottom: '6px solid var(--border-color)'
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          left: '50%',
                          top: '-5px',
                          transform: 'translateX(-50%)',
                          width: 0,
                          height: 0,
                          borderLeft: '5px solid transparent',
                          borderRight: '5px solid transparent',
                          borderBottom: '5px solid var(--bg-primary)'
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Botón minimizar/expandir */}
        <button
          onClick={() => {
            const nuevoEstado = !minimizado;
            setMinimizado(nuevoEstado);
            onMinimizadoChange?.(nuevoEstado);
          }}
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
            {seccionActiva === 'adiso' && adisoAbierto && (
              <div style={{ height: '100%', overflowY: 'auto' }}>
                <ModalAdiso
                  adiso={adisoAbierto}
                  onCerrar={onCerrarAdiso}
                  onAnterior={onAnterior}
                  onSiguiente={onSiguiente}
                  puedeAnterior={puedeAnterior}
                  puedeSiguiente={puedeSiguiente}
                  dentroSidebar={true}
                />
              </div>
            )}

            {seccionActiva === 'mapa' && (
              <MapaInteractivo adisos={[]} onAbrirAdiso={() => {}} />
            )}

            {seccionActiva === 'publicar' && (
              <FormularioPublicar
                onPublicar={(adiso) => {
                  onPublicar(adiso);
                }}
                onCerrar={() => {
                  setSeccionActiva('adiso');
                }}
                onError={onError}
                onSuccess={onSuccess}
                dentroSidebar={true}
              />
            )}

            {seccionActiva === 'chatbot' && (
              <ChatbotIA
                onPublicar={onPublicar}
                onError={onError}
                onSuccess={onSuccess}
              />
            )}

            {seccionActiva === 'gratuitos' && (
              <AdisosGratuitos todosLosAdisos={todosLosAdisos} />
            )}

            {/* Estado vacío cuando no hay contenido */}
            {seccionActiva === 'adiso' && !adisoAbierto && (
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
                Selecciona un adiso para ver los detalles
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
              const mostrarTooltip = tooltipHovered === seccion.id;
              return (
                <div
                  key={seccion.id}
                  style={{ position: 'relative' }}
                  onMouseEnter={() => setTooltipHovered(seccion.id)}
                  onMouseLeave={() => setTooltipHovered(null)}
                >
                  <button
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
                  >
                    <IconComponent size={18} />
                  </button>
                  
                  {/* Tooltip para botones minimizados - hacia la izquierda */}
                  {mostrarTooltip && minimizado && (
                    <div
                      style={{
                        position: 'absolute',
                        right: 'calc(100% + 0.75rem)',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        backgroundColor: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        padding: '0.625rem 0.875rem',
                        borderRadius: '8px',
                        fontSize: '0.8125rem',
                        fontWeight: 500,
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        border: '1px solid var(--border-color)',
                        zIndex: 2000,
                        pointerEvents: 'none',
                        animation: 'fadeInTooltipLeft 0.2s ease-out',
                        maxWidth: '300px',
                        minWidth: '250px',
                        width: 'max-content',
                        lineHeight: 1.5,
                        whiteSpace: 'normal'
                      }}
                    >
                      <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                        {seccion.label}
                      </div>
                      <div style={{ 
                        fontSize: '0.75rem', 
                        color: 'var(--text-secondary)',
                        fontWeight: 400,
                        lineHeight: 1.5,
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word'
                      }}>
                        {seccion.descripcion}
                      </div>
                      {/* Flecha del tooltip apuntando hacia la derecha */}
                      <div
                        style={{
                          position: 'absolute',
                          right: '-6px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: 0,
                          height: 0,
                          borderTop: '6px solid transparent',
                          borderBottom: '6px solid transparent',
                          borderLeft: '6px solid var(--border-color)'
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          right: '-5px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: 0,
                          height: 0,
                          borderTop: '5px solid transparent',
                          borderBottom: '5px solid transparent',
                          borderLeft: '5px solid var(--bg-primary)'
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

