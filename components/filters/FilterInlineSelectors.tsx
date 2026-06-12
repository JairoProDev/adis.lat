'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Adiso, Categoria } from '@/types';
import { BrowseFilterState } from '@/lib/filters/types';
import { getFiltersForCategory, getFilterDefinition } from '@/lib/filters/definitions';
import { clearInlineFilter, getInlineFilterButtons } from '@/lib/filters/inline-display';
import { countFacetOption } from '@/lib/filters/apply';
import { IconChevronDown, IconClose } from '@/components/Icons';

const pillClass =
  'inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border flex-shrink-0 min-h-[32px] transition-colors';

interface FilterInlineSelectorsProps {
  categoria: Categoria | 'todos';
  filters: BrowseFilterState;
  onChange: (next: BrowseFilterState) => void;
  adisos: Adiso[];
  busqueda: string;
  onOpenUbicacion?: () => void;
  userLat?: number;
  userLng?: number;
}

export default function FilterInlineSelectors({
  categoria,
  filters,
  onChange,
  adisos,
  busqueda,
  onOpenUbicacion,
  userLat,
  userLng,
}: FilterInlineSelectorsProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openId) return;
    const onDoc = (e: MouseEvent) => {
      if (rowRef.current && !rowRef.current.contains(e.target as Node)) {
        setOpenId(null);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenId(null);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [openId]);

  const buttons = getInlineFilterButtons(categoria, filters);

  const renderPopover = (buttonId: string) => {
    const def = getFilterDefinition(buttonId, categoria)
      ?? getFiltersForCategory(categoria).find((d) => d.id === buttonId);

    if (buttonId === 'precio') {
      return (
        <div className="p-3 space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              placeholder="Mín"
              defaultValue={filters.precioMin ?? ''}
              id="precio-min-input"
              className="w-full px-2 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-sm"
            />
            <span className="text-[var(--text-tertiary)]">—</span>
            <input
              type="number"
              min={0}
              placeholder="Máx"
              defaultValue={filters.precioMax ?? ''}
              id="precio-max-input"
              className="w-full px-2 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-sm"
            />
          </div>
          <button
            type="button"
            className="w-full py-2 rounded-lg text-sm font-semibold text-white"
            style={{ backgroundColor: 'var(--brand-blue)' }}
            onClick={() => {
              const minEl = document.getElementById('precio-min-input') as HTMLInputElement;
              const maxEl = document.getElementById('precio-max-input') as HTMLInputElement;
              const min = minEl?.value ? Number(minEl.value) : undefined;
              const max = maxEl?.value ? Number(maxEl.value) : undefined;
              onChange({
                ...filters,
                precioMin: min && min > 0 ? min : undefined,
                precioMax: max && max > 0 ? max : undefined,
              });
              setOpenId(null);
            }}
          >
            Aplicar
          </button>
        </div>
      );
    }

    if (buttonId === 'publicadoEn' && def?.options) {
      return (
        <ul className="py-1 max-h-[240px] overflow-y-auto">
          <li>
            <button
              type="button"
              className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--hover-bg)]"
              onClick={() => {
                onChange({ ...filters, publicadoEn: undefined });
                setOpenId(null);
              }}
            >
              Cualquier fecha
            </button>
          </li>
          {def.options.map((opt) => (
            <li key={opt.value}>
              <button
                type="button"
                className={`w-full text-left px-3 py-2 text-sm hover:bg-[var(--hover-bg)] ${
                  filters.publicadoEn === opt.value ? 'text-[var(--brand-blue)] font-semibold' : ''
                }`}
                onClick={() => {
                  onChange({ ...filters, publicadoEn: opt.value as BrowseFilterState['publicadoEn'] });
                  setOpenId(null);
                }}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      );
    }

    const facetId = def?.id ?? buttonId;
    if (def?.type === 'chips' && def.options) {
      return (
        <ul className="py-1 max-h-[240px] overflow-y-auto">
          {def.options.map((opt) => {
            const count = categoria !== 'todos'
              ? countFacetOption(adisos, categoria, busqueda, filters, facetId, opt.value, userLat, userLng)
              : undefined;
            const disabled = count === 0;
            const selected = filters.facets[facetId] === opt.value;
            return (
              <li key={opt.value}>
                <button
                  type="button"
                  disabled={disabled}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-[var(--hover-bg)] disabled:opacity-40 ${
                    selected ? 'text-[var(--brand-blue)] font-semibold' : ''
                  }`}
                  onClick={() => {
                    const facets = { ...filters.facets };
                    if (selected) delete facets[facetId];
                    else facets[facetId] = opt.value;
                    onChange({ ...filters, facets });
                    setOpenId(null);
                  }}
                >
                  {opt.label}
                  {count != null && count > 0 && (
                    <span className="ml-1 opacity-60">({count})</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      );
    }

    if (def?.type === 'toggle' || ['soloConPrecio', 'conFotos', 'verificado', 'destacado', 'incluirMasAnuncios'].includes(buttonId)) {
      const isFacet = Boolean(def?.requiresCategory);
      const active = isFacet
        ? filters.facets[facetId] === true
        : Boolean(filters[buttonId as keyof BrowseFilterState]);

      return (
        <div className="p-2">
          <button
            type="button"
            className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-[var(--hover-bg)]"
            onClick={() => {
              if (isFacet) {
                const facets = { ...filters.facets };
                if (active) delete facets[facetId];
                else facets[facetId] = true;
                onChange({ ...filters, facets });
              } else {
                onChange({ ...filters, [buttonId]: active ? undefined : true });
              }
              setOpenId(null);
            }}
          >
            {active ? '✓ Activado — tocar para quitar' : 'Activar'}
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <div ref={rowRef} className="relative mb-2">
      <div
        className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {buttons.map((btn) => {
          const isOpen = openId === btn.id;
          const displayText = btn.isActive && btn.activeLabel ? btn.activeLabel : btn.label;

          return (
            <div key={btn.id} className="relative flex-shrink-0">
              <div
                className={`${pillClass} ${
                  btn.isActive
                    ? 'border-[rgba(var(--brand-yellow-rgb),0.55)] bg-[rgba(var(--brand-yellow-rgb),0.12)]'
                    : 'border-[var(--border-color)] bg-[var(--bg-primary)]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    if (btn.type === 'ubicacion') {
                      onOpenUbicacion?.();
                      return;
                    }
                    setOpenId(isOpen ? null : btn.id);
                  }}
                  className="inline-flex items-center gap-1 text-[var(--text-primary)]"
                >
                  <span className="max-w-[140px] truncate">{displayText}</span>
                  {!btn.isActive && <IconChevronDown size={12} className="opacity-60 flex-shrink-0" />}
                </button>
                {btn.isActive && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange(clearInlineFilter(filters, btn.id, btn.facetId));
                    }}
                    className="ml-0.5 p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
                    aria-label={`Quitar ${btn.label}`}
                  >
                    <IconClose size={12} />
                  </button>
                )}
              </div>

              {isOpen && btn.type !== 'ubicacion' && (
                <div
                  className="absolute left-0 top-[calc(100%+6px)] z-[920] min-w-[200px] rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] shadow-lg"
                  style={{ boxShadow: 'var(--shadow-md)' }}
                >
                  {renderPopover(btn.facetId ?? btn.id)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
