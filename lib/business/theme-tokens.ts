import type { ProfileThemePreset } from '@/types/business';

export interface ThemeTokens {
  color: string;
  mode: 'light' | 'dark';
  fontFamily: 'sans' | 'serif' | 'display';
  radius: 'sharp' | 'rounded' | 'pill';
  density: 'compact' | 'comfortable';
  accentStyle: 'solid' | 'gradient' | 'outline';
}

export const THEME_TOKEN_PRESETS: Record<ProfileThemePreset, ThemeTokens> = {
  executive: {
    color: '#1e3a5f',
    mode: 'light',
    fontFamily: 'sans',
    radius: 'rounded',
    density: 'comfortable',
    accentStyle: 'solid',
  },
  minimal: {
    color: '#171717',
    mode: 'light',
    fontFamily: 'serif',
    radius: 'sharp',
    density: 'compact',
    accentStyle: 'outline',
  },
  organic: {
    color: '#2d6a4f',
    mode: 'light',
    fontFamily: 'sans',
    radius: 'pill',
    density: 'comfortable',
    accentStyle: 'gradient',
  },
  cyberpunk: {
    color: '#a855f7',
    mode: 'dark',
    fontFamily: 'display',
    radius: 'rounded',
    density: 'comfortable',
    accentStyle: 'gradient',
  },
};

export function resolveThemeTokens(
  preset?: ProfileThemePreset | null,
  overrides?: Partial<ThemeTokens>
): ThemeTokens {
  const base = THEME_TOKEN_PRESETS[preset || 'executive'];
  return { ...base, ...overrides };
}

export function themeRadiusClass(radius: ThemeTokens['radius']): string {
  switch (radius) {
    case 'sharp':
      return 'rounded-none';
    case 'pill':
      return 'rounded-3xl';
    default:
      return 'rounded-xl';
  }
}

export function themeFontClass(font: ThemeTokens['fontFamily']): string {
  switch (font) {
    case 'serif':
      return 'font-serif';
    case 'display':
      return 'font-sans tracking-tight';
    default:
      return 'font-sans';
  }
}
