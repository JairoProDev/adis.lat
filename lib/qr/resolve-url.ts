/**
 * Única fuente de verdad para URLs codificadas en QR y redirects.
 */

export function getQrShortDomain(): string {
  const custom = process.env.NEXT_PUBLIC_QR_SHORT_DOMAIN?.replace(/\/$/, '');
  if (custom) return custom;
  const site = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://buscadis.com'
  ).replace(/\/$/, '');
  return site;
}

/** URL corta que va dentro del QR (siempre dinámica). */
export function getQrTargetUrl(shortCode: string): string {
  const domain = getQrShortDomain();
  return `${domain}/q/${shortCode}`;
}

/** URL canónica del perfil tras redirect. */
export function getProfileRedirectUrl(slug: string, fromQr = true): string {
  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://buscadis.com'
  ).replace(/\/$/, '');
  const base = `${siteUrl}/p/${slug}`;
  if (!fromQr) return base;
  const params = new URLSearchParams({
    utm_source: 'qr',
    utm_medium: 'scan',
    from_qr: '1',
  });
  return `${base}?${params.toString()}`;
}

/** Dominios permitidos para redirect (anti-quishing). */
export function isAllowedRedirectHost(hostname: string): boolean {
  const allowed = [
    'buscadis.com',
    'www.buscadis.com',
    'adis.lat',
    'www.adis.lat',
    'localhost',
    '127.0.0.1',
  ];
  if (allowed.includes(hostname)) return true;
  if (hostname.endsWith('.vercel.app')) return true;
  const appHost = process.env.NEXT_PUBLIC_APP_URL
    ? new URL(process.env.NEXT_PUBLIC_APP_URL).hostname
    : null;
  return appHost === hostname;
}
