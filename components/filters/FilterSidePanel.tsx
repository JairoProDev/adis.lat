'use client';

import React from 'react';
import { Adiso, Categoria } from '@/types';
import { BrowseFilterState } from '@/lib/filters/types';
import FilterControlFields from './FilterControlFields';
import { IconChevronLeft, IconChevronRight } from '@/components/Icons';

interface FilterSidePanelProps {
  categoria: Categoria | 'todos';
  filters: BrowseFilterState;
  onChange: (next: BrowseFilterState) => void;
  adisos: Adiso[];
  busqueda: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onOpenUbicacion?: () => void;
  userLat?: number;
  userLng?: number;
  resultCount: number;
}

export default function FilterSidePanel({
  categoria,
  filters,
  onChange,
  adisos,
  busqueda,
  collapsed,
  onToggleCollapse,
  onOpenUbicacion,
  userLat,
  userLng,
  resultCount,
}: FilterSidePanelProps) {
  if (collapsed) {
    return (
      <aside
        className="flex-shrink-0 sticky top-[72px] self-start border-r border-[var(--border-color)] bg-[var(--bg-primary)]"
        style={{ width: 44, minHeight: 120 }}
      >
        <button
          type="button"
          onClick={onToggleCollapse}
          className="w-full py-4 flex flex-col items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--brand-blue)] hover:bg-[var(--hover-bg)]"
          title="Abrir filtros"
          aria-label="Abrir panel de filtros"
        >
          <IconChevronRight size={18} />
          <span
            className="text-[10px] font-bold uppercase tracking-wide"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
          >
            Filtros
          </span>
        </button>
      </aside>
    );
  }

  return (
    <aside
      className="flex-shrink-0 sticky top-[72px] self-start border-r border-[var(--border-color)] bg-[var(--bg-primary)] overflow-y-auto"
      style={{
        width: 280,
        maxHeight: 'calc(100vh - 72px)',
      }}
    >
      <div className="flex items-center justify-between px-3 py-3 border-b border-[var(--border-color)]">
        <h2 className="text-sm font-bold text-[var(--text-primary)]">Filtros</h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-2 rounded-lg hover:bg-[var(--hover-bg)]"
            title="Minimizar"
            aria-label="Minimizar panel"
          >
            <IconChevronLeft size={16} />
          </button>
        </div>
      </div>
      <div className="p-3">
        <FilterControlFields
          categoria={categoria}
          filters={filters}
          onChange={onChange}
          adisos={adisos}
          busqueda={busqueda}
          userLat={userLat}
          userLng={userLng}
          onOpenUbicacion={onOpenUbicacion}
          compact
        />
      </div>
      <div className="px-3 py-2 border-t border-[var(--border-color)] text-xs text-[var(--text-secondary)]">
        {resultCount} resultados
      </div>
    </aside>
  );
}
