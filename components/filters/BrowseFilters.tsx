'use client';

import React, { useEffect } from 'react';
import { Adiso, Categoria } from '@/types';
import { BrowseFilterState, FilterLayoutMode } from '@/lib/filters/types';
import FilterInlineSelectors from './FilterInlineSelectors';

const LAYOUT_KEY = 'buscadis_filter_layout';

interface BrowseFiltersProps {
  categoria: Categoria | 'todos';
  filters: BrowseFilterState;
  onChange: (filters: BrowseFilterState) => void;
  adisos: Adiso[];
  busqueda: string;
  isDesktop: boolean;
  onOpenUbicacion?: () => void;
  userLat?: number;
  userLng?: number;
  layoutMode: FilterLayoutMode;
  onLayoutModeChange: (mode: FilterLayoutMode) => void;
}

export default function BrowseFilters({
  categoria,
  filters,
  onChange,
  adisos,
  busqueda,
  isDesktop,
  onOpenUbicacion,
  userLat,
  userLng,
  layoutMode,
  onLayoutModeChange,
}: BrowseFiltersProps) {
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LAYOUT_KEY) as FilterLayoutMode | null;
      if (saved === 'inline' || saved === 'panel') onLayoutModeChange(saved);
    } catch { /* ignore */ }
  }, [onLayoutModeChange]);

  const toggleLayout = () => {
    const next: FilterLayoutMode = layoutMode === 'inline' ? 'panel' : 'inline';
    onLayoutModeChange(next);
    try { localStorage.setItem(LAYOUT_KEY, next); } catch { /* ignore */ }
  };

  const layoutToggle = isDesktop ? (
    <button
      type="button"
      onClick={toggleLayout}
      className="flex-shrink-0 text-[11px] font-semibold text-[var(--text-secondary)] hover:text-[var(--brand-blue)] px-2 py-1.5 rounded-lg hover:bg-[var(--hover-bg)] whitespace-nowrap self-center"
    >
      {layoutMode === 'panel' ? 'En línea' : 'Panel'}
    </button>
  ) : null;

  if (layoutMode === 'panel' && isDesktop) {
    return <div className="flex justify-end pb-1">{layoutToggle}</div>;
  }

  return (
    <div className="pb-1">

      <div className="flex items-start gap-1 min-w-0">
        <div className="flex-1 min-w-0">
          <FilterInlineSelectors
            categoria={categoria}
            filters={filters}
            onChange={onChange}
            adisos={adisos}
            busqueda={busqueda}
            onOpenUbicacion={onOpenUbicacion}
            userLat={userLat}
            userLng={userLng}
          />
        </div>
        {layoutToggle}
      </div>
    </div>
  );
}
