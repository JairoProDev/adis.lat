import type { CSSProperties } from 'react';
import type { BusinessProfile } from '@/types/business';
import type { Adiso } from '@/types';
import { resolveThemeTokens, themeFontClass } from '@/lib/business/theme-tokens';
import type { ProfileThemePreset } from '@/types/business';

export function getBusinessCanonicalUrl(slug: string): string {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://buscadis.com').replace(/\/$/, '');
  return `${siteUrl}/${slug}`;
}

export function getWhatsappUrl(
  phone: string,
  businessName: string,
  message?: string
): string {
  const text =
    message ||
    `Hola, vi su perfil de ${businessName} en Buscadis y me gustaría más información.`;
  const digits = phone.replace(/\D/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function getProductWhatsappUrl(
  phone: string,
  businessName: string,
  product: Adiso
): string {
  const price = product.precio ? ` — S/ ${product.precio}` : '';
  const text = `Hola ${businessName}, me interesa: *${product.titulo}*${price}. Lo vi en su catálogo Buscadis.`;
  return getWhatsappUrl(phone, businessName, text);
}

export function getCartWhatsappUrl(
  phone: string,
  businessName: string,
  items: { title: string; qty: number; price?: number }[]
): string {
  const lines = items.map(
    (i) => `• ${i.qty}x ${i.title}${i.price ? ` (S/ ${i.price})` : ''}`
  );
  const text = `Hola ${businessName}, quiero consultar por estos productos de su catálogo:\n\n${lines.join('\n')}\n\n¿Están disponibles?`;
  return getWhatsappUrl(phone, businessName, text);
}

export function businessThemeStyle(profile: Partial<BusinessProfile>): CSSProperties {
  const preset = (profile.theme_preset || 'executive') as ProfileThemePreset;
  const tokens = resolveThemeTokens(preset, {
    color: profile.theme_color || undefined,
    mode: profile.theme_mode === 'dark' ? 'dark' : profile.theme_mode === 'light' ? 'light' : undefined,
  });
  const isDark = tokens.mode === 'dark';

  return {
    '--brand-color': tokens.color,
    '--bg-primary': isDark ? '#0f172a' : '#ffffff',
    '--bg-secondary': isDark ? '#020617' : '#f8fafc',
    '--bg-tertiary': isDark ? '#1e293b' : '#e2e8f0',
    '--text-primary': isDark ? '#f8fafc' : '#0f172a',
    '--text-secondary': isDark ? '#cbd5e1' : '#475569',
    '--text-tertiary': isDark ? '#64748b' : '#94a3b8',
    '--border-color': isDark ? '#334155' : '#e2e8f0',
    '--border-subtle': isDark ? '#1e293b' : '#f1f5f9',
    '--theme-radius': tokens.radius === 'sharp' ? '0px' : tokens.radius === 'pill' ? '1.5rem' : '0.75rem',
  } as CSSProperties;
}

export function businessThemeClassName(profile: Partial<BusinessProfile>): string {
  const preset = (profile.theme_preset || 'executive') as ProfileThemePreset;
  const tokens = resolveThemeTokens(preset);
  return themeFontClass(tokens.fontFamily);
}
