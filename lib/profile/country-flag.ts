const COUNTRY_NAME_TO_CODE: Record<string, string> = {
  peru: 'pe',
  perú: 'pe',
  mexico: 'mx',
  méxico: 'mx',
  colombia: 'co',
  argentina: 'ar',
  chile: 'cl',
  ecuador: 'ec',
  bolivia: 'bo',
  'estados unidos': 'us',
  usa: 'us',
};

export function resolveCountryCode(country?: string | null, countryCode?: string | null): string | null {
  if (countryCode?.trim()) return countryCode.trim().toLowerCase();
  if (!country?.trim()) return null;
  const normalized = country.trim().toLowerCase();
  if (normalized.length === 2) return normalized;
  return COUNTRY_NAME_TO_CODE[normalized] || null;
}

export function countryFlagImageUrl(code?: string | null): string | null {
  if (!code?.trim()) return null;
  return `https://flagcdn.com/w20/${code.trim().toLowerCase()}.png`;
}
