'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { Adiso, AdisoPromotionTier, ADISO_PROMOTION_TIERS } from '@/types';
import { promoteAdisoInSupabase } from '@/lib/supabase';
import { IconClose } from '@/components/Icons';

interface PromoteAdisoModalProps {
  adiso: Adiso;
  onClose: () => void;
  onPromoted: (tier: AdisoPromotionTier, expiresAt: string | null) => void;
}

const DURACIONES_DIAS = [3, 7, 14, 30];

export default function PromoteAdisoModal({ adiso, onClose, onPromoted }: PromoteAdisoModalProps) {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const [tier, setTier] = useState<AdisoPromotionTier>(
    adiso.promotionTier && adiso.promotionTier !== 'gratis' ? adiso.promotionTier : 'destacada'
  );
  const [dias, setDias] = useState(7);
  const [promoting, setPromoting] = useState(false);

  const info = ADISO_PROMOTION_TIERS[tier];
  const total = info.precioPorDia * dias;

  const handlePromote = async () => {
    if (!user?.id || promoting) return;

    setPromoting(true);
    try {
      const expiresAt = tier === 'gratis' ? null : new Date(Date.now() + dias * 24 * 60 * 60 * 1000).toISOString();
      await promoteAdisoInSupabase(adiso.id, user.id, tier, dias);
      success(
        tier === 'gratis'
          ? 'Tu anuncio volvió al orden estándar.'
          : `¡Listo! Tu anuncio ahora es ${info.nombre.toLowerCase()} por ${dias} días.`
      );
      onPromoted(tier, expiresAt);
    } catch {
      toastError('No se pudo promocionar el anuncio. Intenta de nuevo.');
    } finally {
      setPromoting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[10002] bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-[var(--bg-primary)] rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-5 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Promocionar anuncio</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="min-w-[36px] min-h-[36px] flex items-center justify-center text-[var(--text-secondary)]">
            <IconClose size={18} />
          </button>
        </div>
        <p className="text-sm text-[var(--text-secondary)] mb-4 line-clamp-1">
          {adiso.titulo}
        </p>

        <p className="text-sm font-medium text-[var(--text-primary)] mb-2">Visibilidad</p>
        <div className="grid grid-cols-1 gap-2 mb-4">
          {(Object.keys(ADISO_PROMOTION_TIERS) as AdisoPromotionTier[]).map((tierId) => {
            const tierInfo = ADISO_PROMOTION_TIERS[tierId];
            const selected = tier === tierId;
            return (
              <button
                key={tierId}
                type="button"
                onClick={() => setTier(tierId)}
                className={`flex items-center justify-between gap-3 rounded-xl border p-3 text-left transition-colors ${
                  selected
                    ? 'border-[var(--brand-blue)] bg-[rgba(var(--brand-primary-rgb),0.08)]'
                    : 'border-[var(--border-color)]'
                }`}
              >
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    {tierId === 'premium' ? '👑 ' : tierId === 'destacada' ? '⭐ ' : ''}{tierInfo.nombre}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">{tierInfo.descripcion}</p>
                </div>
                <span className="text-sm font-semibold text-[var(--brand-blue)] flex-shrink-0">
                  {tierInfo.precioPorDia === 0 ? 'Gratis' : `S/ ${tierInfo.precioPorDia}/día`}
                </span>
              </button>
            );
          })}
        </div>

        {tier !== 'gratis' && (
          <>
            <p className="text-sm font-medium text-[var(--text-primary)] mb-2">Duración</p>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {DURACIONES_DIAS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDias(d)}
                  className={`py-2 rounded-lg border text-sm font-semibold transition-colors ${
                    dias === d
                      ? 'border-[var(--brand-blue)] bg-[rgba(var(--brand-primary-rgb),0.08)] text-[var(--brand-blue)]'
                      : 'border-[var(--border-color)] text-[var(--text-primary)]'
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between mb-4 px-1">
              <span className="text-sm text-[var(--text-secondary)]">Total</span>
              <span className="text-lg font-bold text-[var(--brand-blue)]">S/ {total}</span>
            </div>
          </>
        )}

        <button
          type="button"
          onClick={handlePromote}
          disabled={promoting}
          className="w-full py-3 rounded-full bg-[var(--brand-blue)] text-white font-semibold disabled:opacity-50 disabled:pointer-events-none transition-opacity"
        >
          {promoting
            ? 'Procesando…'
            : tier === 'gratis'
              ? 'Quitar promoción'
              : `Promocionar por S/ ${total}`}
        </button>
      </div>
    </div>,
    document.body
  );
}
