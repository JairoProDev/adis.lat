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
import ChatbotIA from './ChatbotIA';
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
  todosLosAdisos = []
}: SidebarDesktopProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [seccionActiva, setSeccionActiva] = useState<SeccionSidebar>(seccionInicial || 'adiso');
  const [minimizado, setMinimizado] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [tooltipHovered, setTooltipHovered] = useState<SeccionSidebar | null>(null);

  // Auto-open adiso section and expand sidebar when adiso is opened
  React.useEffect(() => {
    if (adisoAbierto) {
      setSeccionActiva('adiso');
      if (minimizado) setMinimizado(false);
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
    { id: 'chatbot' as SeccionSidebar, icono: IconChatbot, label: 'Chatbot', descripcion: 'Asistente de búsqueda inteligente (próximamente)' },
    { id: 'gratuitos' as SeccionSidebar, icono: IconGratuitos, label: 'Gratuitos', descripcion: 'Ver y publicar adisos gratuitos' }
  ];

  const anchoSidebar = minimizado ? 60 : 420;

  return (
    <motion.div
      className={cn(
        'fixed top-0 right-0 bottom-0 z-[1500]',
        'glass-card border-l border-border-subtle',
        'flex flex-col'
      )}
      style={{
        backgroundColor: 'var(--glass-bg)',
        backdropFilter: 'blur(40px) saturate(200%)',
        WebkitBackdropFilter: 'blur(40px) saturate(200%)',
        boxShadow: 'var(--shadow-lg)',
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
            className={cn(
              'flex border-b border-border-subtle',
              'bg-secondary/50 overflow-x-auto',
              'scrollbar-thin scrollbar-thumb-tertiary'
            )}
          >
            {secciones.map((seccion) => {
              const IconComponent = seccion.icono;
              const estaActiva = seccionActiva === seccion.id;
              const esPublicar = seccion.id === 'publicar';

              return (
                <div
                  key={seccion.id}
                  className="relative"
                  style={{ flex: esPublicar ? 1.2 : 1 }}
                  onMouseEnter={() => setTooltipHovered(seccion.id)}
                  onMouseLeave={() => setTooltipHovered(null)}
                >
                  <motion.button
                    onClick={() => {
                      setSeccionActiva(seccion.id);
                      setMostrarFormulario(seccion.id === 'publicar');
                    }}
                    className={cn(
                      'w-full min-w-[80px] flex flex-col items-center gap-1',
                      'transition-all duration-200',
                      esPublicar ? 'py-3.5 px-2 rounded-lg m-1' : 'py-3 px-2',
                      esPublicar
                        ? 'bg-amber-500 text-obsidian-900 shadow-glow-amber'
                        : estaActiva
                        ? 'bg-primary text-primary'
                        : 'text-secondary hover:bg-hover-lift'
                    )}
                    whileHover={esPublicar ? { y: -1, scale: 1.02 } : undefined}
                    whileTap={{ scale: 0.98 }}
                  >
                    <IconComponent size={18} />
                    <span className={cn(
                      'text-xs font-semibold',
                      esPublicar && 'font-bold'
                    )}>
                      {seccion.label}
                    </span>

                    {/* Active Indicator */}
                    {estaActiva && !esPublicar && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-x-0 bottom-0 h-0.5 bg-electric-500"
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
                        className={cn(
                          'absolute left-1/2 -translate-x-1/2',
                          'top-full mt-3 z-[2000]',
                          'glass-card px-3.5 py-2.5 rounded-lg',
                          'min-w-[250px] max-w-[300px]',
                          'pointer-events-none'
                        )}
                      >
                        <div className="font-semibold text-sm text-primary mb-1">
                          {seccion.label}
                        </div>
                        <div className="text-xs text-secondary leading-relaxed">
                          {seccion.descripcion}
                        </div>
                        {/* Arrow */}
                        <div className="absolute left-1/2 -translate-x-1/2 -top-1.5 w-3 h-3 bg-primary border-t border-l border-border-subtle rotate-45" />
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
        className={cn(
          'absolute z-10',
          'w-8 h-8 rounded-full',
          'glass-card shadow-glow-md',
          'flex items-center justify-center',
          'hover:scale-110 active:scale-95',
          'transition-transform duration-200'
        )}
        style={{
          top: '0.5rem',
          left: minimizado ? '50%' : '-1rem',
          transform: minimizado ? 'translateX(-50%)' : 'none'
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
            className="flex-1 overflow-y-auto"
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
              <MapaInteractivo adisos={[]} onAbrirAdiso={() => {}} />
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

            {/* Empty State */}
            {seccionActiva === 'adiso' && !adisoAbierto && (
              <div className="flex flex-col items-center justify-center h-full px-8 text-center">
                <div className="text-tertiary mb-4 opacity-50">
                  <IconAdiso size={48} />
                </div>
                <p className="text-secondary text-sm">
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
            className="flex flex-col items-center pt-14 pb-4 gap-3"
          >
            {secciones.map((seccion) => {
              const IconComponent = seccion.icono;
              const estaActiva = seccionActiva === seccion.id;

              return (
                <div
                  key={seccion.id}
                  className="relative"
                  onMouseEnter={() => setTooltipHovered(seccion.id)}
                  onMouseLeave={() => setTooltipHovered(null)}
                >
                  <motion.button
                    onClick={() => {
                      setMinimizado(false);
                      setSeccionActiva(seccion.id);
                      setMostrarFormulario(seccion.id === 'publicar');
                    }}
                    className={cn(
                      'w-10 h-10 rounded-xl',
                      'flex items-center justify-center',
                      'transition-all duration-200',
                      estaActiva
                        ? 'bg-electric-500 text-white shadow-glow-electric'
                        : 'bg-secondary text-secondary hover:bg-hover-lift'
                    )}
                    whileHover={{ scale: 1.1, y: -2 }}
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
                        className={cn(
                          'absolute right-full mr-3 top-1/2 -translate-y-1/2',
                          'glass-card px-3.5 py-2.5 rounded-lg',
                          'min-w-[250px] max-w-[300px]',
                          'pointer-events-none z-[2000]'
                        )}
                      >
                        <div className="font-semibold text-sm text-primary mb-1">
                          {seccion.label}
                        </div>
                        <div className="text-xs text-secondary leading-relaxed">
                          {seccion.descripcion}
                        </div>
                        {/* Arrow */}
                        <div className="absolute right-[-0.375rem] top-1/2 -translate-y-1/2 w-3 h-3 bg-primary border-r border-b border-border-subtle rotate-45" />
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
