'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Adiso } from '@/types';
import { IconAdiso, IconMap, IconMegaphone, IconChatbot, IconGratuitos, IconMinimize, IconExpand, IconStore, IconClose } from './Icons';
import ModalAdiso from './ModalAdiso';
import MapaInteractivo from './MapaInteractivo';
import FormularioPublicar from './FormularioPublicar';
import ChatbotIA from './ChatbotIANew';
import AdisosGratuitos from './AdisosGratuitos';
import { useNavigation } from '@/contexts/NavigationContext';

export type SeccionSidebar = 'adiso' | 'mapa' | 'publicar' | 'chatbot' | 'gratuitos' | 'negocio';

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
  seccionActiva: SeccionSidebar;
  onMinimizadoChange?: (minimizado: boolean) => void;
  todosLosAdisos?: Adiso[];
  minimizado?: boolean;
}

const SIDEBAR_WIDTH = 420;
const COLLAPSED_TAB = 40;
const HEADER_HEIGHT = 'var(--header-height, 72px)';

/**
 * Panel lateral derecho — participa en el layout flex (no overlay).
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
  seccionActiva,
  onMinimizadoChange,
  todosLosAdisos = [],
  minimizado = true,
}: SidebarDesktopProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [internalMinimizado, setInternalMinimizado] = useState(minimizado);
  const { setSidebarExpanded, abrirAdiso } = useNavigation();

  useEffect(() => {
    setInternalMinimizado(minimizado);
  }, [minimizado]);

  useEffect(() => {
    setSidebarExpanded(!internalMinimizado);
  }, [internalMinimizado, setSidebarExpanded]);

  if (!isDesktop) return null;

  const handleMinimizarToggle = () => {
    const nuevoEstado = !internalMinimizado;
    setInternalMinimizado(nuevoEstado);
    onMinimizadoChange?.(nuevoEstado);
  };

  if (internalMinimizado) {
    return (
      <aside
        className="flex-shrink-0 self-start mx-1 mt-2"
        style={{
          width: COLLAPSED_TAB,
          position: 'sticky',
          top: `calc(${HEADER_HEIGHT} + 8px)`,
          zIndex: 500,
        }}
      >
        <button
          type="button"
          onClick={handleMinimizarToggle}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-[var(--bg-primary)] shadow-sm border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--brand-blue)] hover:border-[var(--brand-blue)]/40 hover:bg-[var(--hover-bg)] transition-colors"
          aria-label="Mostrar panel lateral"
          title="Mostrar panel"
        >
          <IconExpand size={16} />
        </button>
      </aside>
    );
  }

  return (
    <aside
      className="flex-shrink-0 self-start overflow-hidden"
      style={{
        width: SIDEBAR_WIDTH,
        position: 'sticky',
        top: HEADER_HEIGHT,
        height: `calc(100vh - ${HEADER_HEIGHT})`,
        zIndex: 900,
        transition: 'width 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--bg-primary)',
          boxShadow: '-10px 0 30px rgba(0,0,0,0.03)',
          borderTopLeftRadius: '24px',
          borderBottomLeftRadius: '24px',
          overflow: 'hidden',
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={seccionActiva}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            style={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              padding: 0,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
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

            {seccionActiva !== 'adiso' && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  padding: '10px 12px',
                  borderBottom: '1px solid var(--border-color)',
                  flexShrink: 0,
                }}
              >
                <button
                  type="button"
                  onClick={handleMinimizarToggle}
                  aria-label="Ocultar panel"
                  title="Ocultar panel"
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <IconMinimize size={16} />
                </button>
              </div>
            )}

            {seccionActiva === 'mapa' && (
              <MapaInteractivo
                adisos={todosLosAdisos}
                onAbrirAdiso={(adiso) => {
                  abrirAdiso(adiso.id);
                }}
              />
            )}

            {seccionActiva === 'publicar' && (
              <FormularioPublicar
                onPublicar={onPublicar}
                onCerrar={() => {}}
                onError={onError}
                onSuccess={onSuccess}
                dentroSidebar={true}
              />
            )}

            {seccionActiva === 'gratuitos' && (
              <AdisosGratuitos todosLosAdisos={todosLosAdisos} />
            )}

            {seccionActiva === 'adiso' && !adisoAbierto && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border-color)',
                    flexShrink: 0,
                  }}
                >
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Detalle
                  </span>
                  <button
                    type="button"
                    onClick={handleMinimizarToggle}
                    aria-label="Cerrar panel"
                    title="Cerrar panel"
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <IconClose size={18} />
                  </button>
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flex: 1,
                    padding: '2rem',
                    textAlign: 'center',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <div style={{ opacity: 0.5, marginBottom: '1rem' }}>
                    <IconAdiso size={48} />
                  </div>
                  <p>Selecciona un adiso para ver los detalles</p>
                </div>
              </div>
            )}

            {['negocio'].includes(seccionActiva) && (
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                Cargando sección...
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </aside>
  );
}
