import { PAQUETES, TamañoPaquete } from '@/types';

/**
 * Valida que el número de imágenes no exceda el paquete (reglas de negocio en servidor).
 * Cuenta URLs en imagenesUrls + imagenUrl (incl. blob:/data: como intención de imagen en cliente).
 */
export function validarImagenesSegunPaquete(
  tamaño: TamañoPaquete | undefined,
  imagenesUrls: string[] | undefined | null,
  imagenUrl: string | undefined | null
): { ok: true } | { ok: false; message: string } {
  const t: TamañoPaquete = tamaño && tamaño in PAQUETES ? tamaño : 'miniatura';
  const paquete = PAQUETES[t];

  const urls: string[] = [];
  if (imagenUrl?.trim()) {
    urls.push(imagenUrl.trim());
  }
  for (const u of imagenesUrls || []) {
    if (typeof u === 'string' && u.trim()) {
      urls.push(u.trim());
    }
  }

  const n = urls.length;
  if (n > paquete.maxImagenes) {
    return {
      ok: false,
      message: `El paquete "${paquete.nombre}" permite como máximo ${paquete.maxImagenes} imagen(es).`,
    };
  }

  if (paquete.maxImagenes === 0 && n > 0) {
    return {
      ok: false,
      message: 'El paquete Miniatura no permite imágenes.',
    };
  }

  return { ok: true };
}
