'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Adiso, PAQUETES } from '@/types';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface BentoCardProps {
  adiso: Adiso;
  isSelected?: boolean;
  onClick: () => void;
  icon: ReactNode;
  className?: string;
}

/**
 * BentoCard - Premium Ad Card Component
 * Features:
 * - Physics-based hover animations (lift + shadow expansion)
 * - Glassmorphism accent on hover
 * - Tactile feedback on click (scale down)
 * - Subtle zoom-in on images
 * - Tabular numbers for prices
 * - Micro-bordered badges
 */
export default function BentoCard({ adiso, isSelected, onClick, icon, className }: BentoCardProps) {
  const tamaño = adiso.tamaño || 'miniatura';
  const paquete = PAQUETES[tamaño];
  const imagenUrl = adiso.imagenesUrls?.[0] || adiso.imagenUrl;
  const showImage = tamaño !== 'miniatura' && imagenUrl;

  // Responsive sizing based on tamaño
  const sizeClasses = {
    miniatura: 'p-2 md:p-2.5',
    pequeño: 'p-2.5 md:p-3',
    mediano: 'p-3 md:p-3.5',
    grande: 'p-3.5 md:p-4',
    gigante: 'p-4 md:p-4.5',
  };

  const titleSizes = {
    miniatura: 'text-sm md:text-base',
    pequeño: 'text-base md:text-lg',
    mediano: 'text-lg md:text-xl',
    grande: 'text-xl md:text-2xl',
    gigante: 'text-2xl md:text-3xl',
  };

  const titleWeights = {
    miniatura: 'font-semibold',
    pequeño: 'font-bold',
    mediano: 'font-bold',
    grande: 'font-extrabold',
    gigante: 'font-black',
  };

  const lineClamps = {
    miniatura: 'line-clamp-2 md:line-clamp-3',
    pequeño: 'line-clamp-2 md:line-clamp-3',
    mediano: 'line-clamp-3 md:line-clamp-4',
    grande: 'line-clamp-4 md:line-clamp-5',
    gigante: 'line-clamp-5 md:line-clamp-6',
  };

  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'bento-card group relative w-full h-full text-left',
        'flex flex-col gap-2',
        sizeClasses[tamaño],
        isSelected && 'ring-2 ring-electric-500 shadow-glow-electric',
        className
      )}
      style={{
        gridColumn: `span ${paquete.columnas}`,
        gridRow: `span ${paquete.filas}`,
      }}
      whileHover={{
        y: -4,
        transition: { type: 'spring', stiffness: 400, damping: 25 }
      }}
      whileTap={{
        scale: 0.98,
        y: -2,
        transition: { type: 'spring', stiffness: 400, damping: 25 }
      }}
      aria-label={`Ver detalles del adiso: ${adiso.titulo} en ${adiso.categoria}`}
      tabIndex={0}
    >
      {/* Glow Line on Hover */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-electric-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Image Section with Zoom Effect */}
      {showImage && (
        <motion.div
          className="relative w-full rounded-lg overflow-hidden bg-graphite-800"
          style={{
            height: tamaño === 'pequeño' ? '130px' :
                    tamaño === 'mediano' ? '150px' :
                    tamaño === 'grande' ? '190px' : '230px'
          }}
        >
          <motion.div
            className="w-full h-full"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <Image
              src={imagenUrl}
              alt={adiso.titulo}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover"
              loading="lazy"
            />
          </motion.div>

          {/* Gradient Overlay for Better Text Contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-obsidian-900/20 via-transparent to-transparent pointer-events-none" />
        </motion.div>
      )}

      {/* Category Badge */}
      <div className="badge flex items-center gap-1.5">
        {icon}
        <span className="capitalize text-[0.7rem] md:text-xs font-semibold tracking-wider">
          {adiso.categoria}
        </span>
      </div>

      {/* Title Section */}
      <div className="flex-1 flex flex-col justify-start min-h-0">
        <h3
          className={cn(
            titleSizes[tamaño],
            titleWeights[tamaño],
            lineClamps[tamaño],
            'text-primary break-words hyphens-auto'
          )}
          style={{
            letterSpacing: tamaño === 'miniatura' ? '-0.01em' : '-0.02em'
          }}
        >
          {adiso.titulo}
        </h3>
      </div>

      {/* Selected Indicator */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-2 right-2 w-2 h-2 rounded-full bg-electric-500 shadow-glow-electric"
        />
      )}
    </motion.button>
  );
}
