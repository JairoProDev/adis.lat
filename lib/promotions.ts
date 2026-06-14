import { ADISO_PROMOTION_TIERS, AdisoPromotionTier } from '@/types';

export const PROMOTION_DURATIONS_DAYS = [3, 7, 14, 30] as const;
export type PromotionDurationDays = (typeof PROMOTION_DURATIONS_DAYS)[number];

export function isValidPromotionTier(tier: string): tier is AdisoPromotionTier {
  return tier === 'gratis' || tier === 'destacada' || tier === 'premium';
}

export function isValidPromotionDays(days: number): days is PromotionDurationDays {
  return (PROMOTION_DURATIONS_DAYS as readonly number[]).includes(days);
}

/** Precio total en soles, calculado solo en servidor. */
export function calculatePromotionTotalPen(tier: AdisoPromotionTier, days: number): number {
  if (tier === 'gratis' || days <= 0) return 0;
  const unit = ADISO_PROMOTION_TIERS[tier].precioPorDia;
  return Math.round(unit * days * 100) / 100;
}

export function promotionExpiresAtIso(tier: AdisoPromotionTier, days: number): string | null {
  if (tier === 'gratis' || days <= 0) return null;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

export function promotionCheckoutLabel(tier: AdisoPromotionTier, days: number): string {
  const info = ADISO_PROMOTION_TIERS[tier];
  if (tier === 'gratis') return 'Quitar promoción';
  const total = calculatePromotionTotalPen(tier, days);
  return `Promocionar ${info.nombre.toLowerCase()} · ${days} días · S/ ${total}`;
}
