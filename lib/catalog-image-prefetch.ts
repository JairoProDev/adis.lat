/**
 * Precarga URLs de imágenes del catálogo para que el SW / caché HTTP las tenga
 * antes de quedar sin conexión (especialmente con loading="lazy" en lista virtualizada).
 */

function normalizeImagesField(raw: unknown): unknown[] {
  if (raw == null) return [];
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return Array.isArray(raw) ? raw : [];
}

function collectImageUrlsFromProduct(p: Record<string, unknown>): string[] {
  const out: string[] = [];
  const imgs = normalizeImagesField(p.images);
  for (const item of imgs) {
    if (typeof item === 'string' && item.startsWith('http')) {
      out.push(item);
    } else if (item && typeof item === 'object' && 'url' in item) {
      const u = (item as { url?: string }).url;
      if (u && u.startsWith('http')) out.push(u);
    }
  }
  return out;
}

export function collectCatalogImageUrls(products: unknown[]): string[] {
  const set = new Set<string>();
  for (const raw of products) {
    if (!raw || typeof raw !== 'object') continue;
    const p = raw as Record<string, unknown>;
    for (const u of collectImageUrlsFromProduct(p)) {
      set.add(u);
    }
  }
  return [...set];
}

/**
 * Precarga en segundo plano (Image) para que el SW / disco cacheen las URLs
 * sin depender de CORS en fetch() frente a Supabase Storage.
 */
export function prefetchCatalogProductImages(products: unknown[]): void {
  if (typeof window === 'undefined' || !navigator.onLine) return;

  const urls = collectCatalogImageUrls(products);
  if (urls.length === 0) return;

  let index = 0;
  const batchSize = 6;

  const step = () => {
    const end = Math.min(index + batchSize, urls.length);
    for (; index < end; index++) {
      const img = new Image();
      img.decoding = 'async';
      img.src = urls[index];
    }
    if (index < urls.length) {
      if (typeof requestIdleCallback === 'function') {
        requestIdleCallback(step, { timeout: 5000 });
      } else {
        setTimeout(step, 40);
      }
    }
  };

  step();
}
