import QRCode from 'qrcode';
import sharp from 'sharp';
import type { QrStyleConfig } from './types';
import { buildFreeStyleConfig } from './presets';

const BUSCADIS_WATERMARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
  <rect width="120" height="120" rx="24" fill="#2563eb"/>
  <text x="60" y="72" text-anchor="middle" font-family="Arial,sans-serif" font-size="42" font-weight="bold" fill="#fff">B</text>
</svg>`;

export interface GenerateFreeQrOptions {
  data: string;
  themeColor?: string;
  styleConfig?: QrStyleConfig;
  width?: number;
  withWatermark?: boolean;
}

export async function generateFreeQrPng(options: GenerateFreeQrOptions): Promise<Buffer> {
  const config = options.styleConfig || buildFreeStyleConfig(options.themeColor);
  const dark = config.dotsColor || options.themeColor || '#1e293b';
  const light = config.backgroundColor || '#ffffff';
  const width = options.width ?? 512;

  const png = await QRCode.toBuffer(options.data, {
    type: 'png',
    errorCorrectionLevel: 'Q',
    margin: 2,
    width,
    color: { dark, light },
  });

  if (options.withWatermark === false) return png;

  const watermark = Buffer.from(BUSCADIS_WATERMARK_SVG);
  const logoSize = Math.round(width * 0.18);
  const logo = await sharp(watermark).resize(logoSize, logoSize).png().toBuffer();
  const left = Math.round((width - logoSize) / 2);
  const top = Math.round((width - logoSize) / 2);

  return sharp(png)
    .composite([{ input: logo, left, top }])
    .png()
    .toBuffer();
}

export async function generateFreeQrSvg(options: GenerateFreeQrOptions): Promise<string> {
  const config = options.styleConfig || buildFreeStyleConfig(options.themeColor);
  const dark = config.dotsColor || options.themeColor || '#1e293b';
  const light = config.backgroundColor || '#ffffff';
  const width = options.width ?? 400;

  return QRCode.toString(options.data, {
    type: 'svg',
    errorCorrectionLevel: 'Q',
    margin: 2,
    width,
    color: { dark, light },
  });
}

/** Inline SVG string for embedding in flyers (no external URL). */
export async function generateFreeQrSvgInline(options: GenerateFreeQrOptions): Promise<string> {
  const svg = await generateFreeQrSvg(options);
  return svg.replace(/<\?xml[^>]*\?>\s*/i, '').trim();
}
