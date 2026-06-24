import type { CSSProperties } from 'react';
import type { BusinessProfile } from '@/types/business';
import type { ProfileThemePreset } from '@/types/business';
import { resolveThemeTokens } from '@/lib/business/theme-tokens';

export function buildBusinessThemeVars(profile: Partial<BusinessProfile>): CSSProperties {
  const preset = (profile.theme_preset || 'executive') as ProfileThemePreset;
  const tokens = resolveThemeTokens(preset, {
    color: profile.theme_color || undefined,
    mode:
      profile.theme_mode === 'dark'
        ? 'dark'
        : profile.theme_mode === 'light'
          ? 'light'
          : undefined,
  });
  const isDark = tokens.mode === 'dark';

  const radius =
    tokens.radius === 'sharp' ? '0px' : tokens.radius === 'pill' ? '1.5rem' : '0.75rem';
  const densityGap = tokens.density === 'compact' ? '0.5rem' : '1rem';

  const styleExtra = profile.profile_style as { accentColor?: string } | null | undefined;
  const primary = profile.theme_color || tokens.color;
  const accent = profile.theme_accent_color || styleExtra?.accentColor || '#ffc24a';

  return {
    '--brand-color': primary,
    '--brand-accent': accent,
    '--bg-primary': isDark ? '#1c2229' : '#ffffff',
    '--bg-secondary': isDark ? '#13171d' : '#f8fafc',
    '--bg-tertiary': isDark ? '#283038' : '#e2e8f0',
    '--text-primary': isDark ? '#edf1f5' : '#0f172a',
    '--text-secondary': isDark ? '#9dabb8' : '#475569',
    '--text-tertiary': isDark ? '#6f7d8c' : '#94a3b8',
    '--border-color': isDark ? 'rgba(255,255,255,0.10)' : '#e2e8f0',
    '--border-subtle': isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
    '--bp-surface': isDark ? '#1c2229' : '#ffffff',
    '--bp-surface-elevated': isDark ? '#283038' : '#ffffff',
    '--bp-text': isDark ? '#edf1f5' : '#0f172a',
    '--bp-text-muted': isDark ? '#9dabb8' : '#64748b',
    '--bp-border': isDark ? 'rgba(255,255,255,0.10)' : '#e2e8f0',
    '--bp-radius': radius,
    '--bp-density-gap': densityGap,
    '--theme-radius': radius,
  } as CSSProperties;
}
