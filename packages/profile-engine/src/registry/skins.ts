import type { StyleSkinTokens } from '../types/style';

export const STYLE_SKINS: StyleSkinTokens[] = [
  {
    id: 'buscadis_default',
    label: 'Buscadis',
    color: '#f97316',
    mode: 'light',
    fontFamily: 'sans',
    radius: 'rounded',
    density: 'comfortable',
    accentStyle: 'solid',
  },
  {
    id: 'executive',
    label: 'Ejecutivo',
    color: '#1e3a5f',
    mode: 'light',
    fontFamily: 'sans',
    radius: 'rounded',
    density: 'comfortable',
    accentStyle: 'solid',
  },
  {
    id: 'minimal',
    label: 'Minimal',
    color: '#171717',
    mode: 'light',
    fontFamily: 'serif',
    radius: 'sharp',
    density: 'compact',
    accentStyle: 'outline',
  },
  {
    id: 'organic',
    label: 'Orgánico',
    color: '#2d6a4f',
    mode: 'light',
    fontFamily: 'sans',
    radius: 'pill',
    density: 'comfortable',
    accentStyle: 'gradient',
  },
  {
    id: 'cyberpunk',
    label: 'Cyber',
    color: '#a855f7',
    mode: 'dark',
    fontFamily: 'display',
    radius: 'rounded',
    density: 'comfortable',
    accentStyle: 'gradient',
  },
];

export function getStyleSkin(id: string): StyleSkinTokens {
  return STYLE_SKINS.find((s) => s.id === id) ?? STYLE_SKINS[0];
}
