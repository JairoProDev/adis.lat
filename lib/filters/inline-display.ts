import { Categoria } from '@/types';
import { BrowseFilterState } from './types';
import { getFilterDefinition, getFiltersForCategory } from './definitions';

export interface InlineFilterButton {
  id: string;
  label: string;
  activeLabel?: string;
  isActive: boolean;
  type: 'precio' | 'toggle' | 'select' | 'chips' | 'ubicacion';
  facetId?: string;
}

const TOGGLE_SHORT: Record<string, string> = {
  soloConPrecio: 'Con precio',
  conFotos: 'Con fotos',
  verificado: 'Verificado',
  destacado: 'Destacado',
  incluirMasAnuncios: 'Más catálogo',
};

const PUB_LABELS: Record<string, string> = {
  '24h': 'Últimas 24 h',
  '7d': 'Última semana',
  '30d': 'Último mes',
};

export function getInlineFilterButtons(
  categoria: Categoria | 'todos',
  filters: BrowseFilterState,
): InlineFilterButton[] {
  const buttons: InlineFilterButton[] = [];

  const hasPrecio = (filters.precioMin != null && filters.precioMin > 0)
    || (filters.precioMax != null && filters.precioMax > 0);
  let precioLabel: string | undefined;
  if (filters.precioMin && filters.precioMax) {
    precioLabel = `S/ ${filters.precioMin} – ${filters.precioMax}`;
  } else if (filters.precioMax) {
    precioLabel = `Hasta S/ ${filters.precioMax.toLocaleString('es-PE')}`;
  } else if (filters.precioMin) {
    precioLabel = `Desde S/ ${filters.precioMin.toLocaleString('es-PE')}`;
  }
  buttons.push({
    id: 'precio',
    label: 'Precio',
    activeLabel: precioLabel,
    isActive: hasPrecio,
    type: 'precio',
  });

  for (const [key, short] of Object.entries(TOGGLE_SHORT)) {
    const active = Boolean(filters[key as keyof BrowseFilterState]);
    buttons.push({
      id: key,
      label: short,
      activeLabel: short,
      isActive: active,
      type: 'toggle',
    });
  }

  buttons.push({
    id: 'publicadoEn',
    label: 'Fecha',
    activeLabel: filters.publicadoEn ? PUB_LABELS[filters.publicadoEn] : undefined,
    isActive: Boolean(filters.publicadoEn),
    type: 'select',
  });

  const u = filters.ubicacion;
  const ubicLabel = u?.distrito || u?.provincia || u?.departamento;
  buttons.push({
    id: 'ubicacion',
    label: 'Ubicación',
    activeLabel: ubicLabel,
    isActive: Boolean(ubicLabel),
    type: 'ubicacion',
  });

  if (categoria !== 'todos') {
    const catDefs = getFiltersForCategory(categoria).filter((d) => d.requiresCategory);
    for (const def of catDefs) {
      const raw = filters.facets[def.id];
      if (def.type === 'toggle') {
        const active = raw === true;
        buttons.push({
          id: def.id,
          label: def.label,
          activeLabel: def.label,
          isActive: active,
          type: 'toggle',
          facetId: def.id,
        });
        continue;
      }
      if (def.type === 'chips' && def.options) {
        const val = typeof raw === 'string' ? raw : undefined;
        const opt = val ? def.options.find((o) => o.value === val) : undefined;
        buttons.push({
          id: def.id,
          label: def.label,
          activeLabel: opt?.label,
          isActive: Boolean(val),
          type: 'chips',
          facetId: def.id,
        });
      }
    }
  }

  return buttons;
}

export function clearInlineFilter(
  filters: BrowseFilterState,
  buttonId: string,
  facetId?: string,
): BrowseFilterState {
  const next = { ...filters, facets: { ...filters.facets } };

  if (buttonId === 'precio') {
    delete next.precioMin;
    delete next.precioMax;
    return next;
  }
  if (buttonId === 'ubicacion') {
    delete next.ubicacion;
    return next;
  }
  if (buttonId === 'publicadoEn') {
    delete next.publicadoEn;
    return next;
  }
  if (TOGGLE_SHORT[buttonId]) {
    delete next[buttonId as keyof BrowseFilterState];
    return next;
  }
  if (facetId) {
    delete next.facets[facetId];
  }
  return next;
}
