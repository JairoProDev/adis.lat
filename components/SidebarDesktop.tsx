'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Adiso } from '@/types';
import { cn } from '@/lib/utils';
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
  seccionInicial?: SeccionSidebar;
  onMinimizadoChange?: (minimizado: boolean) => void;
  todosLosAdisos?: Adiso[];
}

/**
 * Premium Sidebar with Glassmorphism 2.0
 * Features:
 * - Glass background with high-quality blur and saturation
 * - Smooth width transitions with spring physics
 * - Floating minimize button with micro-interactions
 * - Premium tab system with gradient indicators
 * - Animated tooltips with arrow indicators
 */
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
  todosLosAdisos = [],
  defaultMinimized = false
}: SidebarDesktopProps & { defaultMinimized?: boolean }) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [seccionActiva, setSeccionActiva] = useState<SeccionSidebar>(seccionInicial || 'adiso');
  const [minimizado, setMinimizado] = useState(defaultMinimized);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [tooltipHovered, setTooltipHovered] = useState<SeccionSidebar | null>(null);

  // Auto-open adiso section and expand sidebar when adiso is opened
  React.useEffect(() => {
    if (adisoAbierto) {
      setSeccionActiva('adiso');
      // Only expand if we didn't start minimized by default or if user action requires it
      if (minimizado && !defaultMinimized) setMinimizado(false);
    }
  }, [adisoAbierto]);

  // Update section from external prop
  React.useEffect(() => {
    if (seccionInicial) {
      setSeccionActiva(seccionInicial);
      setMostrarFormulario(seccionInicial === 'publicar');
    }
  }, [seccionInicial]);

  if (!isDesktop) return null;

  const secciones = [
    { id: 'adiso' as SeccionSidebar, icono: IconAdiso, label: 'Adiso', descripcion: 'Ver detalles del adiso seleccionado' },
    { id: 'mapa' as SeccionSidebar, icono: IconMap, label: 'Mapa', descripcion: 'Explorar adisos en el mapa interactivo' },
    { id: 'publicar' as SeccionSidebar, icono: IconMegaphone, label: 'Publicar', descripcion: 'Crear y publicar un nuevo adiso' },
    // { id: 'chatbot' as SeccionSidebar, icono: IconChatbot, label: 'Chatbot', descripcion: 'Asistente (ahora abajo derecha)' },
    { id: 'gratuitos' as SeccionSidebar, icono: IconGratuitos, label: 'Gratuitos', descripcion: 'Ver y publicar adisos gratuitos' }
  ];

  const anchoSidebar = minimizado ? 60 : 420;

  return (
    <motion.div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        zIndex: 1500,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--glass-bg)',
        backdropFilter: 'blur(40px) saturate(200%)',
        WebkitBackdropFilter: 'blur(40px) saturate(200%)',
        boxShadow: 'var(--shadow-lg)',
        borderLeft: '1px solid var(--border-subtle)',
      }}
      initial={{ x: anchoSidebar }}
      animate={{
        width: anchoSidebar,
        x: 0
      }}
      transition={{
        type: 'spring',
        stiffness: 260,
        damping: 20
      }}
    >
      {/* Header with tabs - Expanded state */}
      <AnimatePresence>
        {!minimizado && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              display: 'flex',
              borderBottom: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-secondary)',
              overflow: 'visible',
              zIndex: 10,
            }}
          >
            {secciones.map((seccion) => {
              const IconComponent = seccion.icono;
              const estaActiva = seccionActiva === seccion.id;
              const esPublicar = seccion.id === 'publicar';

              return (
                <div
                  key={seccion.id}
                  style={{
                    flex: esPublicar ? 1.2 : 1,
                    position: 'relative',
                  }}
                  onMouseEnter={() => setTooltipHovered(seccion.id)}
                  onMouseLeave={() => setTooltipHovered(null)}
                >
                  <motion.button
                    onClick={() => {
                      setSeccionActiva(seccion.id);
                      setMostrarFormulario(seccion.id === 'publicar');
                    }}
                    style={{
                      width: '100%',
                      minWidth: '80px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.25rem',
                      transition: 'all 0.2s',
                      padding: esPublicar ? '0.875rem 0.5rem' : '0.75rem 0.5rem',
                      borderRadius: esPublicar ? '0.5rem' : '0',
                      margin: esPublicar ? '0.25rem' : '0',
                      backgroundColor: esPublicar
                        ? '#ffdd4a'
                        : estaActiva
                          ? 'var(--bg-primary)'
                          : 'transparent',
                      color: esPublicar
                        ? 'var(--text-primary)'
                        : estaActiva
                          ? 'var(--accent-color)'
                          : 'var(--text-secondary)',
                      border: 'none',
                      cursor: 'pointer',
                      position: 'relative',
                      boxShadow: esPublicar ? 'var(--shadow-md)' : 'none',
                    }}
                    whileHover={esPublicar ? { y: -1, scale: 1.02 } : { backgroundColor: 'var(--hover-bg)' }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <IconComponent size={18} />
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: esPublicar ? 700 : 600,
                    }}>
                      {seccion.label}
                    </span>

                    {/* Active Indicator */}
                    {estaActiva && !esPublicar && (
                      <motion.div
                        layoutId="activeTab"
                        style={{
                          position: 'absolute',
                          left: 0,
                          right: 0,
                          bottom: 0,
                          height: '2px',
                          backgroundColor: 'var(--accent-color)',
                        }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                  </motion.button>

                  {/* Tooltip */}
                  <AnimatePresence>
                    {tooltipHovered === seccion.id && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        style={{
                          position: 'absolute',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          top: '100%',
                          marginTop: '0.75rem',
                          zIndex: 2000,
                          background: 'var(--glass-bg)',
                          backdropFilter: 'blur(40px) saturate(200%)',
                          WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                          padding: '0.625rem 0.875rem',
                          borderRadius: '0.5rem',
                          minWidth: '250px',
                          maxWidth: '300px',
                          pointerEvents: 'none',
                          boxShadow: 'var(--shadow-md)',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        <div style={{
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          color: 'var(--text-primary)',
                          marginBottom: '0.25rem',
                        }}>
                          {seccion.label}
                        </div>
                        <div style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-secondary)',
                          lineHeight: 1.6,
                        }}>
                          {seccion.descripcion}
                        </div>
                        {/* Arrow */}
                        <div style={{
                          position: 'absolute',
                          left: '50%',
                          transform: 'translateX(-50%) rotate(45deg)',
                          top: '-0.375rem',
                          width: '0.75rem',
                          height: '0.75rem',
                          background: 'var(--bg-primary)',
                          borderTop: '1px solid var(--border-subtle)',
                          borderLeft: '1px solid var(--border-subtle)',
                        }} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Minimize/Expand Button */}
      <motion.button
        onClick={() => {
          const nuevoEstado = !minimizado;
          setMinimizado(nuevoEstado);
          onMinimizadoChange?.(nuevoEstado);
        }}
        style={{
          position: 'absolute',
          zIndex: 10,
          width: '2rem',
          height: '2rem',
          borderRadius: '50%',
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(40px) saturate(200%)',
          WebkitBackdropFilter: 'blur(40px) saturate(200%)',
          boxShadow: 'var(--shadow-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid var(--border-subtle)',
          cursor: 'pointer',
          transition: 'transform 0.2s',
          top: '0.5rem',
          left: minimizado ? '50%' : '-1rem',
          transform: minimizado ? 'translateX(-50%)' : 'none',
          color: 'var(--text-primary)',
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        {minimizado ? <IconExpand size={14} /> : <IconMinimize size={14} />}
      </motion.button>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        {!minimizado && (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
            }}
          >
            {seccionActiva === 'adiso' && adisoAbierto && (
              <ModalAdiso
                adiso={adisoAbierto}
                onCerrar={onCerrarAdiso}
                onAnterior={onAnterior}
                onSiguiente={onSiguiente}
                puedeAnterior={puedeAnterior}
                puedeSiguiente={puedeSiguiente}
                dentroSidebar={true}
              />
            )}

            {seccionActiva === 'mapa' && (
              <MapaInteractivo adisos={[]} onAbrirAdiso={() => { }} />
            )}

            {seccionActiva === 'publicar' && (
              <FormularioPublicar
                onPublicar={onPublicar}
                onCerrar={() => setSeccionActiva('adiso')}
                onError={onError}
                onSuccess={onSuccess}
                dentroSidebar={true}
              />
            )}

            {/* Chatbot section removed - moved to floating widget */}

            {seccionActiva === 'gratuitos' && (
              <AdisosGratuitos todosLosAdisos={todosLosAdisos} />
            )}

            {/* Empty State */}
            {seccionActiva === 'adiso' && !adisoAbierto && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                padding: '0 2rem',
                textAlign: 'center',
              }}>
                <div style={{
                  color: 'var(--text-tertiary)',
                  marginBottom: '1rem',
                  opacity: 0.5,
                }}>
                  <IconAdiso size={48} />
                </div>
                <p style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.875rem',
                }}>
                  Selecciona un adiso para ver los detalles
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* Minimized State - Vertical Icons */}
        {minimizado && (
          <motion.div
            key="minimized"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              paddingTop: '3.5rem',
              paddingBottom: '1rem',
              gap: '0.75rem',
            }}
          >
            {secciones.map((seccion) => {
              const IconComponent = seccion.icono;
              const estaActiva = seccionActiva === seccion.id;

              return (
                <div
                  key={seccion.id}
                  style={{
                    position: 'relative',
                  }}
                  onMouseEnter={() => setTooltipHovered(seccion.id)}
                  onMouseLeave={() => setTooltipHovered(null)}
                >
                  <motion.button
                    onClick={() => {
                      setMinimizado(false);
                      setSeccionActiva(seccion.id);
                      setMostrarFormulario(seccion.id === 'publicar');
                    }}
                    style={{
                      width: '2.5rem',
                      height: '2.5rem',
                      borderRadius: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s',
                      backgroundColor: estaActiva
                        ? 'var(--accent-color)'
                        : 'var(--bg-secondary)',
                      color: estaActiva
                        ? 'white'
                        : 'var(--text-secondary)',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: estaActiva ? 'var(--shadow-md)' : 'none',
                    }}
                    whileHover={{ scale: 1.1, y: -2, backgroundColor: estaActiva ? 'var(--accent-color)' : 'var(--hover-bg)' }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <IconComponent size={18} />
                  </motion.button>

                  {/* Tooltip for Minimized Icons */}
                  <AnimatePresence>
                    {tooltipHovered === seccion.id && (
                      <motion.div
                        initial={{ opacity: 0, x: 5 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 5 }}
                        style={{
                          position: 'absolute',
                          right: '100%',
                          marginRight: '0.75rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'var(--glass-bg)',
                          backdropFilter: 'blur(40px) saturate(200%)',
                          WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                          padding: '0.625rem 0.875rem',
                          borderRadius: '0.5rem',
                          minWidth: '250px',
                          maxWidth: '300px',
                          pointerEvents: 'none',
                          zIndex: 2000,
                          boxShadow: 'var(--shadow-md)',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        <div style={{
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          color: 'var(--text-primary)',
                          marginBottom: '0.25rem',
                        }}>
                          {seccion.label}
                        </div>
                        <div style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-secondary)',
                          lineHeight: 1.6,
                        }}>
                          {seccion.descripcion}
                        </div>
                        {/* Arrow */}
                        <div style={{
                          position: 'absolute',
                          right: '-0.375rem',
                          top: '50%',
                          transform: 'translateY(-50%) rotate(45deg)',
                          width: '0.75rem',
                          height: '0.75rem',
                          background: 'var(--bg-primary)',
                          borderRight: '1px solid var(--border-subtle)',
                          borderBottom: '1px solid var(--border-subtle)',
                        }} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
