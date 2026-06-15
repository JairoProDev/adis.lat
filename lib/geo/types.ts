/** Filtro de ubicación unificado para exploración y búsqueda */
export interface BrowseLocationFilter {
  countryCode?: string;
  country?: string;
  departamento?: string;
  provincia?: string;
  distrito?: string;
  radioKm?: number;
  latitud?: number;
  longitud?: number;
}

export interface GeoSearchResult {
  type: 'country' | 'level1' | 'level2' | 'level3';
  countryCode: string;
  countryName: string;
  flag: string;
  label: string;
  path: string;
  departamento?: string;
  provincia?: string;
  distrito?: string;
}

export interface GeoDetectResult {
  countryCode: string;
  countryName: string;
  flag: string;
  departamento?: string;
  provincia?: string;
  distrito?: string;
  latitud?: number;
  longitud?: number;
  source: 'gps' | 'ip' | 'default';
}
