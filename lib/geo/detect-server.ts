import { State } from 'country-state-city';
import { DEFAULT_COUNTRY_CODE, getCountryByCode } from './countries-data';
import { getPeruDepartamentos } from './peru-enhanced';
import type { GeoDetectResult } from './types';

function normalize(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function matchPeruDepartment(region?: string): string | undefined {
  if (!region) return undefined;
  const depts = getPeruDepartamentos();
  const n = normalize(region);
  return depts.find((d) => normalize(d) === n || normalize(d).includes(n) || n.includes(normalize(d)));
}

function matchState(countryCode: string, region?: string): string | undefined {
  if (!region) return undefined;
  const n = normalize(region);
  return State.getStatesOfCountry(countryCode).find(
    (s) => normalize(s.name) === n || normalize(s.name).includes(n),
  )?.name;
}

export async function detectFromIP(): Promise<GeoDetectResult> {
  try {
    const res = await fetch('https://ipapi.co/json/', { cache: 'no-store' });
    const data = await res.json();
    const code = (data.country_code as string) || DEFAULT_COUNTRY_CODE;
    const country = getCountryByCode(code);
    const region = data.region as string | undefined;
    const city = data.city as string | undefined;

    let departamento: string | undefined;
    let provincia: string | undefined;
    let distrito: string | undefined;

    if (code === 'PE') {
      departamento = matchPeruDepartment(region) || region;
      provincia = city;
      distrito = city && departamento === 'Lima' ? city : undefined;
    } else {
      departamento = matchState(code, region) || region;
      provincia = city;
    }

    return {
      countryCode: code,
      countryName: country?.name || data.country_name || 'Perú',
      flag: country?.flag || '🌍',
      departamento,
      provincia,
      distrito,
      latitud: data.latitude,
      longitud: data.longitude,
      source: 'ip',
    };
  } catch {
    return defaultDetect();
  }
}

export async function detectFromCoords(
  lat: number,
  lng: number,
): Promise<GeoDetectResult> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`,
      { headers: { 'User-Agent': 'Buscadis/1.0' } },
    );
    const data = await res.json();
    const addr = data.address || {};
    const code =
      (addr.country_code as string | undefined)?.toUpperCase() || DEFAULT_COUNTRY_CODE;
    const country = getCountryByCode(code);
    const region = addr.state || addr.region;
    const city = addr.city || addr.town || addr.municipality;
    const suburb = addr.suburb || addr.neighbourhood || addr.district;

    let departamento: string | undefined;
    let provincia: string | undefined;
    let distrito: string | undefined;

    if (code === 'PE') {
      departamento = matchPeruDepartment(region) || region;
      provincia = addr.county || city;
      distrito = suburb || city;
    } else {
      departamento = matchState(code, region) || region;
      provincia = city;
      distrito = suburb;
    }

    return {
      countryCode: code,
      countryName: country?.name || addr.country || 'Perú',
      flag: country?.flag || '🌍',
      departamento,
      provincia,
      distrito,
      latitud: lat,
      longitud: lng,
      source: 'gps',
    };
  } catch {
    return detectFromIP();
  }
}

export function defaultDetect(): GeoDetectResult {
  const country = getCountryByCode(DEFAULT_COUNTRY_CODE)!;
  return {
    countryCode: DEFAULT_COUNTRY_CODE,
    countryName: country.name,
    flag: country.flag,
    departamento: 'Cusco',
    source: 'default',
  };
}
