'use client';

import { useEffect, useState } from 'react';
import { Categoria } from '@/types';

interface InterestPreviewPanelProps {
  categoria: Categoria;
  titulo: string;
  descripcion: string;
  ubicacion?: string;
  showPaymentCta?: boolean;
}

interface PreviewItem {
  matchScore: number;
  reasons: string[];
  hint?: string;
  locationHint?: string;
  lastActiveAt?: string;
}

export default function InterestPreviewPanel({
  categoria,
  titulo,
  descripcion,
  ubicacion,
  showPaymentCta = false,
}: InterestPreviewPanelProps) {
  const [count, setCount] = useState<number | null>(null);
  const [items, setItems] = useState<PreviewItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!titulo.trim() || titulo.trim().length < 4) {
      setCount(null);
      setItems([]);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true);
      const params = new URLSearchParams({
        categoria,
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
      });
      if (ubicacion) params.set('ubicacion', ubicacion);

      fetch(`/api/publish/interest-preview?${params}`, { signal: controller.signal })
        .then((r) => r.json())
        .then((data: { count?: number; interested?: PreviewItem[] }) => {
          setCount(data.count ?? 0);
          setItems(data.interested ?? []);
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setCount(0);
            setItems([]);
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 600);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [categoria, titulo, descripcion, ubicacion]);

  if (!titulo.trim() || titulo.trim().length < 4) return null;

  return (
    <div
      className="rounded-2xl border p-4"
      style={{
        borderColor: 'rgba(var(--brand-primary-rgb), 0.2)',
        background: 'rgba(var(--brand-primary-rgb), 0.06)',
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg font-bold"
          style={{ background: 'var(--brand-blue)', color: 'white' }}
        >
          {loading ? '…' : count ?? '—'}
        </div>
        <div className="min-w-0 flex-1">
          <p className="m-0 text-sm font-bold text-[var(--text-primary)]">
            {loading
              ? 'Calculando interesados…'
              : count && count > 0
                ? `¡${count} ${count === 1 ? 'persona interesada' : 'personas interesadas'}!`
                : 'Detectando demanda en tu zona'}
          </p>
          <p className="mt-1 mb-0 text-xs text-[var(--text-secondary)] leading-relaxed">
            {showPaymentCta
              ? 'Al publicar y pagar, estos usuarios recibirán tu oferta al instante y podrás contactarlos de inmediato.'
              : 'Personas que buscan algo similar a lo que ofreces. Resultados garantizados desde el primer segundo.'}
          </p>
        </div>
      </div>

      {items.length > 0 && (
        <ul className="mt-3 space-y-2 border-t pt-3" style={{ borderColor: 'rgba(var(--brand-primary-rgb), 0.15)' }}>
          {items.slice(0, 5).map((item, i) => (
            <li key={i} className="flex items-center justify-between gap-2 text-xs">
              <span className="text-[var(--text-secondary)] truncate">
                {item.locationHint} · {item.hint}
              </span>
              <span className="shrink-0 font-semibold text-[var(--brand-blue)]">
                {item.matchScore}% match
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
