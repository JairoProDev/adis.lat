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

/**
 * Premium Sidebar Panel - Controlled by Header
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
    const width = internalMinimizado ? 0 : 420;
    document.documentElement.style.setProperty('--sidebar-width', `${width}px`);
    setSidebarExpanded(!internalMinimizado);
  }, [internalMinimizado, setSidebarExpanded]);

  if (!isDesktop) return null;

  const anchoSidebar = internalMinimizado ? 0 : 420;

  const handleMinimizarToggle = () => {
    const nuevoEstado = !internalMinimizado;
    setInternalMinimizado(nuevoEstado);
    onMinimizadoChange?.(nuevoEstado);
  };

  return (
    <>
      {internalMinimizado && (
        <motion.button
          type="button"
          onClick={handleMinimizarToggle}
          style={{
            position: 'fixed',
            right: '8px',
            top: '84px',
            zIndex: 950,
            width: '36px',
            height: '36px',
            borderRadius: '12px',
            backgroundColor: 'var(--bg-primary)',
            boxShadow: 'var(--shadow-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--border-color)',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
          }}
          whileHover={{ scale: 1.05, backgroundColor: 'var(--bg-secondary)' }}
          whileTap={{ scale: 0.95 }}
          aria-label="Mostrar panel lateral"
          title="Mostrar panel"
        >
          <IconExpand size={16} />
        </motion.button>
      )}

    <div
      style={{
        position: 'fixed',
        top: '72px',
        right: 0,
        height: 'calc(100vh - 72px)',
        width: anchoSidebar,
        zIndex: 900,
        overflow: 'hidden',
        pointerEvents: internalMinimizado ? 'none' : 'auto',
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
          boxShadow: internalMinimizado ? 'none' : '-10px 0 30px rgba(0,0,0,0.03)',
          borderTopLeftRadius: '24px',
          borderBottomLeftRadius: '24px',
          overflow: 'hidden',
        }}
      >
        <AnimatePresence mode="wait">
          {!internalMinimizado && (
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
          )}
        </AnimatePresence>
      </div>
    </div>
    </>
  );
}
