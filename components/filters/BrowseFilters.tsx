'use client';

import React from 'react';
import { Adiso, Categoria } from '@/types';
import { BrowseFilterState } from '@/lib/filters/types';
import FilterInlineSelectors from './FilterInlineSelectors';

interface BrowseFiltersProps {
  categoria: Categoria | 'todos';
  filters: BrowseFilterState;
  onChange: (filters: BrowseFilterState) => void;
  adisos: Adiso[];
  busqueda: string;
  isDesktop: boolean;
  visible: boolean;
  onOpenUbicacion?: () => void;
  userLat?: number;
  userLng?: number;
  onOpenSidebar?: () => void;
  onOpenMobileFilters?: () => void;
}

export default function BrowseFilters({
  categoria,
  filters,
  onChange,
  adisos,
  busqueda,
  isDesktop,
  visible,
  onOpenUbicacion,
  userLat,
  userLng,
  onOpenSidebar,
  onOpenMobileFilters,
}: BrowseFiltersProps) {
  if (!visible) return null;

  return (
    <div className="pt-2 pb-1">
      <FilterInlineSelectors
        categoria={categoria}
        filters={filters}
        onChange={onChange}
        adisos={adisos}
        busqueda={busqueda}
        onOpenUbicacion={onOpenUbicacion}
        userLat={userLat}
        userLng={userLng}
        onOpenSidebar={isDesktop ? onOpenSidebar : undefined}
        onOpenMobileFilters={!isDesktop ? onOpenMobileFilters : undefined}
      />
    </div>
  );
}
