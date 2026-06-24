import type { LocationDisplayLevel } from '@/types/business';
import type { ProfileLocation } from '@buscadis/profile-engine';
import { countryFlagImageUrl, resolveCountryCode } from '@/lib/profile/country-flag';

const LEVEL_ORDER: LocationDisplayLevel[] = [
  'address',
  'district',
  'city',
  'region',
  'country',
];

export function parseLocationFromAddress(address?: string): ProfileLocation {
  if (!address?.trim()) return {};
  const parts = address.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return { address };
  const country = parts.length >= 2 ? parts[parts.length - 1] : undefined;
  const countryCode = resolveCountryCode(country);
  if (parts.length === 1) return { city: parts[0], address, country, countryCode: countryCode || undefined };
  if (parts.length === 2) {
    return { city: parts[0], region: parts[1], address, country: parts[1], countryCode: countryCode || undefined };
  }
  return {
    district: parts[0],
    city: parts[parts.length - 2],
    country,
    countryCode: countryCode || undefined,
    address,
  };
}

export function resolveLocationDisplayText(
  location: ProfileLocation | undefined,
  level: LocationDisplayLevel = 'city',
  fallbackAddress?: string
): { text: string; flagUrl?: string } {
  const loc = location?.address || location?.city ? location : parseLocationFromAddress(fallbackAddress);
  const maxIdx = LEVEL_ORDER.indexOf(level);
  const pick = (key: keyof ProfileLocation) => {
    const val = loc[key];
    return typeof val === 'string' && val.trim() ? val.trim() : null;
  };

  const flagUrl = countryFlagImageUrl(
    resolveCountryCode(loc.country, loc.countryCode)
  ) ?? undefined;

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
      if (key === 'address' && val.includes(',')) {
        const short = val.split(',')[0].trim();
        return { text: short, flagUrl };
      }
      return { text: val, flagUrl };
    }
  }

  if (fallbackAddress?.trim()) {
    const short = fallbackAddress.split(',')[0].trim();
    return { text: short, flagUrl };
  }
  return { text: '' };
}
