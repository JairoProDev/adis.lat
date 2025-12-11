'use client';

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Adiso, Categoria } from '@/types';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useAuth } from '@/hooks/useAuth';
import { registrarClick } from '@/lib/analytics';
import { cn } from '@/lib/utils';
import BentoCard from './BentoCard';
import {
  IconEmpleos,
  IconInmuebles,
  IconVehiculos,
  IconServicios,
  IconProductos,
  IconEventos,
  IconNegocios,
  IconComunidad
} from './Icons';

const getCategoriaIcon = (categoria: Categoria): React.ComponentType<{ size?: number; color?: string }> => {
  const iconMap: Record<Categoria, React.ComponentType<{ size?: number; color?: string }>> = {
    empleos: IconEmpleos,
    inmuebles: IconInmuebles,
    vehiculos: IconVehiculos,
    servicios: IconServicios,
    productos: IconProductos,
    eventos: IconEventos,
    negocios: IconNegocios,
    comunidad: IconComunidad,
  };
  return iconMap[categoria];
};

interface GrillaAdisosProps {
  adisos: Adiso[];
  onAbrirAdiso: (adiso: Adiso) => void;
  adisoSeleccionadoId?: string | null;
  espacioAdicional?: number;
  cargandoMas?: boolean;
  sentinelRef?: React.RefObject<HTMLDivElement>;
}

export default function GrillaAdisos({
  adisos,
  onAbrirAdiso,
  adisoSeleccionadoId,
  espacioAdicional = 0,
  cargandoMas = false,
  sentinelRef
}: GrillaAdisosProps) {
  const adisoRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const { user } = useAuth();

  const handleClickAdiso = (adiso: Adiso) => {
    registrarClick(user?.id, adiso.id, adiso.categoria);
    onAbrirAdiso(adiso);
  };

  // Calculate columns based on available space
  const getColumnas = () => {
    if (!isDesktop) return 2;

    const columnasBase = 4;
    const columnasAdicionales = Math.floor(espacioAdicional / 180);
    return Math.min(columnasBase + columnasAdicionales, 7);
  };

  const columnas = getColumnas();

  // Auto-scroll when selected ad changes
  useEffect(() => {
    if (adisoSeleccionadoId && adisoRefs.current[adisoSeleccionadoId]) {
      const elemento = adisoRefs.current[adisoSeleccionadoId];
      if (elemento) {
        setTimeout(() => {
          elemento.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          });
        }, 100);
      }
    }
  }, [adisoSeleccionadoId]);

  // Stagger animation for grid items
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.03
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 300,
        damping: 24
      }
    }
  };

  return (
    <div className="w-full">
      {/* Premium Bento Grid */}
      <motion.div
        className={cn(
          'grid gap-2 md:gap-3',
          'auto-rows-[80px]'
        )}
        style={{
          gridTemplateColumns: `repeat(${columnas}, 1fr)`
        }}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <AnimatePresence mode="popLayout">
          {adisos.map((adiso, index) => {
            const estaSeleccionado = adiso.id === adisoSeleccionadoId;
            const IconComponent = getCategoriaIcon(adiso.categoria);

            return (
              <motion.div
                key={adiso.id}
                variants={itemVariants}
                layout
                ref={(el) => {
                  if (el) {
                    adisoRefs.current[adiso.id] = el as unknown as HTMLButtonElement;
                  }
                }}
              >
                <BentoCard
                  adiso={adiso}
                  isSelected={estaSeleccionado}
                  onClick={() => handleClickAdiso(adiso)}
                  icon={<IconComponent size={12} />}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* Infinite Scroll Sentinel with Premium Loader */}
      <div
        ref={sentinelRef}
        className={cn(
          'w-full flex items-center justify-center',
          'transition-all duration-300',
          cargandoMas ? 'py-8' : 'py-4'
        )}
      >
        {cargandoMas && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3"
          >
            {/* Animated Spinner */}
            <motion.div
              className="w-5 h-5 rounded-full border-2 border-border-subtle border-t-electric-500"
              animate={{ rotate: 360 }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                ease: 'linear'
              }}
            />
            <span className="text-sm font-medium text-secondary">
              Cargando más anuncios...
            </span>
          </motion.div>
        )}
      </div>
    </div>
  );
}
