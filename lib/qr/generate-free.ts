import QRCode from 'qrcode';
import type { QrStyleConfig } from './types';
import { buildFreeStyleConfig } from './presets';

export interface GenerateFreeQrOptions {
  data: string;
  themeColor?: string;
  styleConfig?: QrStyleConfig;
  width?: number;
  logoUrl?: string;
  /** @deprecated Sin marca Buscadis en el centro — usar logo del negocio */
  withWatermark?: boolean;
}

/** QR gratuito con logo del negocio y esquinas redondeadas (listo para empaque). */
export async function generateFreeQrPng(options: GenerateFreeQrOptions): Promise<Buffer> {
  const config = options.styleConfig || buildFreeStyleConfig(options.themeColor);
  const width = options.width ?? 512;

  if (options.logoUrl) {
    const { generateProQrPng } = await import('./generate-pro');
    return generateProQrPng({
      data: options.data,
      styleConfig: {
        ...config,
        dotType: config.dotType || 'rounded',
        cornerSquareType: config.cornerSquareType || 'extra-rounded',
        cornerDotType: config.cornerDotType || 'dot',
        hideBackgroundDots: true,
        imageSize: config.imageSize ?? 0.28,
      },
      width,
      logoUrl: options.logoUrl,
    });
  }

  const dark = config.dotsColor || options.themeColor || '#1e293b';
  const light = config.backgroundColor || '#ffffff';

  return QRCode.toBuffer(options.data, {
    type: 'png',
    errorCorrectionLevel: 'Q',
    margin: 2,
    width,
    color: { dark, light },
  });
}

export async function generateFreeQrSvg(options: GenerateFreeQrOptions): Promise<string> {
  if (options.logoUrl) {
    const { generateProQrSvg } = await import('./generate-pro');
    const config = options.styleConfig || buildFreeStyleConfig(options.themeColor);
    return generateProQrSvg({
      data: options.data,
      styleConfig: {
        ...config,
        dotType: config.dotType || 'rounded',
        cornerSquareType: config.cornerSquareType || 'extra-rounded',
        cornerDotType: config.cornerDotType || 'dot',
        hideBackgroundDots: true,
        imageSize: config.imageSize ?? 0.28,
      },
      width: options.width ?? 400,
      logoUrl: options.logoUrl,
    });
  }

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

export async function generateFreeQrSvgInline(options: GenerateFreeQrOptions): Promise<string> {
  const svg = await generateFreeQrSvg(options);
  return svg.replace(/<\?xml[^>]*\?>\s*/i, '').trim();
}
