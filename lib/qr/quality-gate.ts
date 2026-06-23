/** WCAG relative luminance contrast ratio between two hex colors. */

function hexToRgb(hex: string): [number, number, number] | null {
  const normalized = hex.replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return null;
  const n = parseInt(normalized, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function luminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function contrastRatio(colorA: string, colorB: string): number {
  const rgbA = hexToRgb(colorA);
  const rgbB = hexToRgb(colorB);
  if (!rgbA || !rgbB) return 0;
  const l1 = luminance(...rgbA);
  const l2 = luminance(...rgbB);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export interface QualityGateResult {
  ok: boolean;
  contrast: number;
  message?: string;
}

const MIN_CONTRAST = 4.5;

export function validateQrContrast(
  dotsColor: string,
  backgroundColor: string
): QualityGateResult {
  const contrast = contrastRatio(dotsColor, backgroundColor);
  if (contrast < MIN_CONTRAST) {
    return {
      ok: false,
      contrast,
      message: `Contraste insuficiente (${contrast.toFixed(1)}:1). Necesitas al menos ${MIN_CONTRAST}:1 para escaneo confiable.`,
    };
  }
  return { ok: true, contrast };
}

/** Decode QR from PNG/JPEG buffer using jsQR (server-side quality gate). */
export async function validateQrDecodable(
  imageBuffer: Buffer,
  expectedData: string
): Promise<QualityGateResult> {
  try {
    const sharp = (await import('sharp')).default;
    const { data, info } = await sharp(imageBuffer)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const jsQR = (await import('jsqr')).default;
    const result = jsQR(new Uint8ClampedArray(data), info.width, info.height);
    if (!result?.data) {
      return { ok: false, contrast: 0, message: 'No se pudo leer el código QR generado.' };
    }
    if (result.data !== expectedData) {
      return { ok: false, contrast: 0, message: 'El QR no codifica la URL esperada.' };
    }
    return { ok: true, contrast: MIN_CONTRAST };
  } catch {
    return { ok: false, contrast: 0, message: 'Error al validar el código QR.' };
  }
}
