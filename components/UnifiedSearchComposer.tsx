'use client';

import { useEffect, useRef, useState } from 'react';
import Buscador from './Buscador';
import { DraftListingCard, DraftListingData } from './ai/DraftListingCard';
import { useAuth } from '@/hooks/useAuth';
import { useUI } from '@/contexts/UIContext';
import { publishQuickAd } from '@/lib/quick-publish';
import { Categoria } from '@/types';
import { IconSearch, IconMegaphone } from './Icons';

interface UnifiedSearchComposerProps {
  value: string;
  onChange: (value: string) => void;
  compact?: boolean;
  onCategoryDetected?: (categoria: Categoria) => void;
  onNotify?: (message: string, type?: 'info' | 'error' | 'success') => void;
  showFilterToggle?: boolean;
  filtersVisible?: boolean;
  onToggleFilters?: () => void;
  activeFiltersCount?: number;
}

const MIN_LENGTH = 12;
const DEBOUNCE_MS = 700;

/**
 * Buscador unificado: el mismo campo sirve para buscar o, si el texto
 * describe un anuncio ("Vendo bicicleta… S/450"), para previsualizar y
 * publicar el aviso con un clic. Un indicador muestra qué acción detectó
 * la IA para que el usuario no se confunda.
 */
export default function UnifiedSearchComposer({
  value,
  onChange,
  compact = false,
  onCategoryDetected,
  onNotify,
  showFilterToggle,
  filtersVisible,
  onToggleFilters,
  activeFiltersCount,
}: UnifiedSearchComposerProps) {
  const { user, profile } = useAuth();
  const { openAuthModal } = useUI();
  const [intent, setIntent] = useState<'search' | 'publish' | null>(null);
  const [draft, setDraft] = useState<DraftListingData | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastCheckedRef = useRef('');

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    const trimmed = value.trim();
    if (trimmed.length < MIN_LENGTH) {
      setIntent(null);
      setDraft(null);
      lastCheckedRef.current = '';
      return;
    }

    timerRef.current = setTimeout(async () => {
      if (trimmed === lastCheckedRef.current) return;
      lastCheckedRef.current = trimmed;

      try {
        const res = await fetch('/api/ai/quick-compose', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: trimmed }),
        });
        const data = await res.json();

        if (data.intent === 'publish' && data.draft) {
          setIntent('publish');
          setDraft({ ...data.draft, imageUrl: '' });
        } else {
          setIntent('search');
          setDraft(null);
        }
      } catch {
        setIntent(null);
        setDraft(null);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value]);

  const handlePublish = async (data: DraftListingData) => {
    if (!user?.id) {
      onNotify?.('Inicia sesión para publicar tu anuncio.', 'info');
      openAuthModal();
      return;
    }

    try {
      await publishQuickAd(user.id, profile, data);
      onNotify?.('¡Anuncio publicado con éxito!', 'success');
      setDraft(null);
      setIntent(null);
      onChange('');
    } catch {
      onNotify?.('No se pudo publicar el anuncio. Intenta de nuevo.', 'error');
    }
  };

  return (
    <div>
      <Buscador
        value={value}
        onChange={onChange}
        compact={compact}
        onCategoryDetected={onCategoryDetected}
        onNotify={onNotify}
        showFilterToggle={showFilterToggle}
        filtersVisible={filtersVisible}
        onToggleFilters={onToggleFilters}
        activeFiltersCount={activeFiltersCount}
      />

      {intent && !compact && (
        <div className="flex items-center justify-center mt-2">
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full ${
              intent === 'publish'
                ? 'bg-[rgba(var(--brand-yellow-rgb),0.15)] text-[#b8860b] dark:text-[var(--brand-yellow)]'
                : 'bg-[rgba(var(--brand-primary-rgb),0.1)] text-[var(--brand-blue)]'
            }`}
          >
            {intent === 'publish' ? (
              <>
                <IconMegaphone size={12} /> Esto parece un anuncio para publicar
              </>
            ) : (
              <>
                <IconSearch size={12} /> Buscando en Buscadis
              </>
            )}
          </span>
        </div>
      )}

      {draft && !compact && (
        <DraftListingCard
          data={draft}
          onPublish={handlePublish}
          onCancel={() => {
            setDraft(null);
            setIntent(null);
          }}
        />
      )}
    </div>
  );
}
