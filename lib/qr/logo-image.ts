import sharp from 'sharp';

/** Logo listo para qr-code-styling (PNG data URL; rasteriza SVG). */
export async function fetchLogoDataUrl(logoUrl: string, size = 320): Promise<string | null> {
  try {
    const res = await fetch(logoUrl);
    if (!res.ok) return null;

    const buf = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get('content-type') || '';
    const isSvg =
      contentType.includes('svg') || logoUrl.toLowerCase().split('?')[0].endsWith('.svg');

    const png = isSvg
      ? await sharp(buf, { density: 300 })
          .resize(size, size, { fit: 'inside', background: { r: 255, g: 255, b: 255, alpha: 0 } })
          .png()
          .toBuffer()
      : await sharp(buf)
          .resize(size, size, { fit: 'inside', background: { r: 255, g: 255, b: 255, alpha: 0 } })
          .png()
          .toBuffer();

    return `data:image/png;base64,${png.toString('base64')}`;
  } catch (err) {
    console.warn('[qr] logo fetch:', err);
    return null;
  }
}
