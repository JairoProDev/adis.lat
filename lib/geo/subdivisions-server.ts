import { State, City } from 'country-state-city';
import {
  getPeruDepartamentos,
  getPeruProvincias,
  getPeruDistritos,
  PERU_ENHANCED,
} from './peru-enhanced';
import { getCountryByCode, getCountryLevelLabels, COUNTRIES } from './countries-data';
import type { GeoSearchResult } from './types';

function normalize(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function getLevel1Options(countryCode: string): string[] {
  if (countryCode === 'PE') {
    const csc = State.getStatesOfCountry('PE').map((s) => s.name);
    const local = getPeruDepartamentos();
    return [...new Set([...local, ...csc])].sort((a, b) => a.localeCompare(b, 'es'));
  }
  return State.getStatesOfCountry(countryCode)
    .map((s) => s.name)
    .sort((a, b) => a.localeCompare(b, 'es'));
}

export function getLevel2Options(countryCode: string, level1: string): string[] {
  if (countryCode === 'PE') {
    const local = getPeruProvincias(level1);
    if (local.length) return local;
    const state = State.getStatesOfCountry('PE').find(
      (s) => normalize(s.name) === normalize(level1),
    );
    if (!state) return [];
    return City.getCitiesOfState('PE', state.isoCode)
      .map((c) => c.name)
      .sort((a, b) => a.localeCompare(b, 'es'));
  }
  const state = State.getStatesOfCountry(countryCode).find(
    (s) => normalize(s.name) === normalize(level1),
  );
  if (!state) return [];
  return City.getCitiesOfState(countryCode, state.isoCode)
    .map((c) => c.name)
    .sort((a, b) => a.localeCompare(b, 'es'));
}

export function getLevel3Options(
  countryCode: string,
  level1: string,
  level2: string,
): string[] {
  if (countryCode === 'PE') {
    return getPeruDistritos(level1, level2);
  }
  return [];
}

export function searchGeoLocations(
  query: string,
  countryCode?: string,
  limit = 20,
): GeoSearchResult[] {
  const q = normalize(query);
  if (!q || q.length < 2) return [];

  const results: GeoSearchResult[] = [];
  const countries = countryCode
    ? [getCountryByCode(countryCode)].filter(Boolean)
    : COUNTRIES;

  for (const country of countries) {
    if (!country) continue;
    if (
      normalize(country.name).includes(q) ||
      normalize(country.nameEn).includes(q) ||
      country.code.toLowerCase() === q
    ) {
      results.push({
        type: 'country',
        countryCode: country.code,
        countryName: country.name,
        flag: country.flag,
        label: country.name,
        path: country.name,
      });
    }
  }

  const searchCountries = countryCode
    ? [countryCode]
    : ['PE', 'US', 'MX', 'AR', 'CL', 'CO', 'EC', 'BO', 'BR', 'ES'];

  for (const code of searchCountries) {
    const country = getCountryByCode(code);
    if (!country) continue;

    if (code === 'PE') {
      for (const dept of PERU_ENHANCED) {
        if (normalize(dept.nombre).includes(q)) {
          results.push({
            type: 'level1',
            countryCode: code,
            countryName: country.name,
            flag: country.flag,
            label: dept.nombre,
            path: `${dept.nombre}, ${country.name}`,
            departamento: dept.nombre,
          });
        }
        for (const prov of dept.provincias) {
          if (normalize(prov.nombre).includes(q)) {
            results.push({
              type: 'level2',
              countryCode: code,
              countryName: country.name,
              flag: country.flag,
              label: `${prov.nombre}, ${dept.nombre}`,
              path: `${prov.nombre}, ${dept.nombre}`,
              departamento: dept.nombre,
              provincia: prov.nombre,
            });
          }
          for (const dist of prov.distritos) {
            if (normalize(dist).includes(q)) {
              results.push({
                type: 'level3',
                countryCode: code,
                countryName: country.name,
                flag: country.flag,
                label: `${dist}, ${prov.nombre}`,
                path: `${dist}, ${prov.nombre}, ${dept.nombre}`,
                departamento: dept.nombre,
                provincia: prov.nombre,
                distrito: dist,
              });
            }
          }
        }
      }
    }

    const states = State.getStatesOfCountry(code);
    for (const state of states) {
      if (normalize(state.name).includes(q)) {
        results.push({
          type: 'level1',
          countryCode: code,
          countryName: country.name,
          flag: country.flag,
          label: state.name,
          path: `${state.name}, ${country.name}`,
          departamento: state.name,
        });
      }
      if (results.length >= limit * 2) break;
      const cities = City.getCitiesOfState(code, state.isoCode);
      for (const city of cities) {
        if (normalize(city.name).includes(q)) {
          results.push({
            type: 'level2',
            countryCode: code,
            countryName: country.name,
            flag: country.flag,
            label: `${city.name}, ${state.name}`,
            path: `${city.name}, ${state.name}`,
            departamento: state.name,
            provincia: city.name,
          });
        }
        if (results.length >= limit * 3) break;
      }
    }
    if (results.length >= limit * 3) break;
  }

  const seen = new Set<string>();
  return results
    .filter((r) => {
      const key = `${r.countryCode}-${r.path}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit);
}

export function getAdminDepth(countryCode: string): number {
  return getCountryLevelLabels(countryCode).depth;
}
