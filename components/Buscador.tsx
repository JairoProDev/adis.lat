'use client';

import { useState, useRef, useEffect } from 'react';
import { FaSearch } from 'react-icons/fa';
import { useTranslation } from '@/hooks/useTranslation';
import {
  IconMapMarkerAlt,
  IconMicrophone,
  IconGoogleLens
} from './Icons';

interface BuscadorProps {
  value: string;
  onChange: (value: string) => void;
  // New props for location and features
  ubicacion?: string;
  onUbicacionClick?: () => void;
  onAudioSearch?: () => void;
  onVisualSearch?: () => void;
}

export default function Buscador({
  value,
  onChange,
  ubicacion = 'Todo el Perú',
  onUbicacionClick,
  onAudioSearch,
  onVisualSearch
}: BuscadorProps) {
  const { t } = useTranslation();

  return (
    <div className={`-mx-4 px-4 py-2 md:mx-0 md:px-0 transition-all duration-300`}>
      <div className="relative group z-30">
        <div
          className={`
            relative flex items-center bg-white border border-gray-200 rounded-full px-4 py-3 
            shadow-[0_2px_12px_rgba(0,0,0,0.08)] transition-all duration-300
            hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] hover:border-gray-300
            focus-within:shadow-[0_4px_20px_rgba(83,172,197,0.15)] focus-within:border-[var(--brand-blue)]
          `}
        >
          {/* Location Trigger */}
          <button
            onClick={onUbicacionClick}
            className="flex items-center gap-2 pr-4 mr-2 border-r border-gray-200 hover:bg-gray-50 rounded-l-full py-1 pl-1 transition-colors group/loc"
            aria-label="Seleccionar ubicación"
            title="Seleccionar ubicación"
          >
            <div className="p-2 bg-gray-100 rounded-full text-[var(--brand-blue)] group-hover/loc:bg-[var(--brand-blue)] group-hover/loc:text-white transition-colors">
              <IconMapMarkerAlt size={18} />
            </div>
            <div className="flex flex-col items-start min-w-[80px] sm:min-w-[100px]">
              <span className="text-[10px] uppercase font-bold text-gray-400 leading-none">Ubicación</span>
              <span className="text-sm font-semibold text-gray-800 truncate max-w-[120px]">{ubicacion}</span>
            </div>
          </button>

          {/* Search Icon */}
          <FaSearch className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />

          {/* Search Input */}
          <input
            type="search"
            placeholder={t('search.placeholder') || "¿Qué estás buscando?"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 min-w-0 border-none outline-none text-[16px] text-gray-700 placeholder-gray-400 bg-transparent truncate h-full py-1"
          />

          {/* Right Actions: Mic & Lens */}
          <div className="flex items-center gap-2 ml-2 pl-2 border-l border-gray-100">
            <button
              onClick={onAudioSearch}
              className="p-2 text-gray-500 hover:text-[var(--brand-blue)] hover:bg-blue-50 rounded-full transition-all"
              title="Búsqueda por voz"
            >
              <IconMicrophone size={20} />
            </button>

            <button
              onClick={onVisualSearch}
              className="p-2 text-gray-500 hover:text-[var(--brand-blue)] hover:bg-blue-50 rounded-full transition-all"
              title="Búsqueda visual"
            >
              <IconGoogleLens size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
