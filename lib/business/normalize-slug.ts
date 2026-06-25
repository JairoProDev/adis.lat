/** Normaliza slug de URL de perfil (@handle, %40handle, espacios). */
export function normalizeBusinessSlug(raw: string): string {
  let slug = decodeURIComponent(String(raw || '').trim());
  while (slug.startsWith('@')) {
    slug = slug.slice(1);
  }
  return slug.toLowerCase();
}
