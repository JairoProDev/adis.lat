import type { BusinessProfile } from '@/types/business';
import type { SubscriptionTier } from '@/lib/qr/types';

export function getSubscriptionTier(profile: Partial<BusinessProfile>): SubscriptionTier {
  const tier = (profile as { subscription_tier?: SubscriptionTier }).subscription_tier;
  if (tier === 'pro' || tier === 'enterprise') return tier;
  return 'free';
}

export function canUseProQr(profile: Partial<BusinessProfile>): boolean {
  const tier = getSubscriptionTier(profile);
  return tier === 'pro' || tier === 'enterprise';
}

export const PRO_QR_MONTHLY_PRICE_PEN = 29;

export const PRO_QR_FEATURES = [
  'Diseñador visual con gradientes y formas',
  'Logo de tu negocio en el centro',
  'Kits imprimibles profesionales',
  'Analítica avanzada de escaneos',
  'Sin marca Buscadis en materiales',
] as const;
