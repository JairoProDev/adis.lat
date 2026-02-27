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
  // New props for features
  onAudioSearch?: () => void;
  onVisualSearch?: () => void;
}

export default function Buscador({
  value,
  onChange,
  onAudioSearch,
  onVisualSearch
}: BuscadorProps) {
  const { t } = useTranslation();

  return (
    <div className={`-mx-4 px-4 py-2 md:mx-0 md:px-0 transition-all duration-300`}>
      <div className="relative group z-30">
        <div
          className={`
            relative flex items-center bg-white dark:bg-zinc-900 border-none rounded-2xl px-6 py-4 
            shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500
            hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] hover:-translate-y-0.5
            focus-within:shadow-[0_20px_50px_rgba(56,189,248,0.15)] focus-within:ring-2 focus-within:ring-sky-400/20
          `}
        >
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
