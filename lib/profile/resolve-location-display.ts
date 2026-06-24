import type { LocationDisplayLevel } from '@/types/business';
import type { ProfileLocation } from '@buscadis/profile-engine';

const LEVEL_ORDER: LocationDisplayLevel[] = [
  'address',
  'district',
  'city',
  'region',
  'country',
];

const COUNTRY_FLAGS: Record<string, string> = {
  PE: '🇵🇪',
  Peru: '🇵🇪',
  Perú: '🇵🇪',
  MX: '🇲🇽',
  CO: '🇨🇴',
  AR: '🇦🇷',
  CL: '🇨🇱',
  EC: '🇪🇨',
  BO: '🇧🇴',
  US: '🇺🇸',
};

export function parseLocationFromAddress(address?: string): ProfileLocation {
  if (!address?.trim()) return {};
  const parts = address.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return { address };
  if (parts.length === 1) return { city: parts[0], address };
  if (parts.length === 2) return { city: parts[0], region: parts[1], address };
  return {
    district: parts[0],
    city: parts[parts.length - 2],
    country: parts[parts.length - 1],
    address,
  };
}

export function resolveLocationDisplayText(
  location: ProfileLocation | undefined,
  level: LocationDisplayLevel = 'city',
  fallbackAddress?: string
): { text: string; flag?: string } {
  const loc = location?.address || location?.city ? location : parseLocationFromAddress(fallbackAddress);
  const maxIdx = LEVEL_ORDER.indexOf(level);
  const pick = (key: keyof ProfileLocation) => {
    const val = loc[key];
    return typeof val === 'string' && val.trim() ? val.trim() : null;
  };

  for (let i = maxIdx; i >= 0; i--) {
    const key = LEVEL_ORDER[i];
    const map: Record<LocationDisplayLevel, keyof ProfileLocation> = {
      address: 'address',
      district: 'district',
      city: 'city',
      region: 'region',
      country: 'country',
    };
    const val = pick(map[key]);
    if (val) {
      const flag =
        COUNTRY_FLAGS[loc.countryCode || ''] ||
        COUNTRY_FLAGS[loc.country || ''] ||
        (key === 'country' ? COUNTRY_FLAGS[val] : undefined);
      if (key === 'address' && val.includes(',')) {
        const short = val.split(',')[0].trim();
        return { text: short, flag };
      }
      return { text: val, flag };
    }
  }

  if (fallbackAddress?.trim()) {
    const short = fallbackAddress.split(',')[0].trim();
    return { text: short };
  }
  return { text: '' };
}
