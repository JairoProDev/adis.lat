/** Utilidades de legibilidad para texto sobre banner de portada */

export function profileHasBanner(bannerUrl?: string | null): boolean {
  return Boolean(bannerUrl?.trim());
}

/** Clases para título sobre banner oscuro (desktop overlap) */
export function heroTitleClass(hasBanner: boolean): string {
  if (!hasBanner) return 'text-[var(--bp-text)]';
  return 'text-[var(--bp-text)] md:text-white md:drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]';
}

export function heroSubtitleClass(hasBanner: boolean): string {
  if (!hasBanner) return 'text-[var(--bp-text-muted)]';
  return 'text-[var(--bp-text-muted)] md:text-white/90 md:drop-shadow-[0_1px_6px_rgba(0,0,0,0.75)]';
}

export function heroHandleClass(hasBanner: boolean): string {
  if (!hasBanner) return 'text-[var(--text-tertiary)]';
  return 'text-[var(--text-tertiary)] md:text-white/75 md:drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]';
}
