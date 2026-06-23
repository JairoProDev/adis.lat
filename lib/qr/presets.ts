import type { QrStyleConfig } from './types';

export interface QrPreset {
  id: string;
  name: string;
  description: string;
  tier: 'free' | 'pro';
  config: QrStyleConfig;
}

export const QR_PRESETS: QrPreset[] = [
  {
    id: 'buscadis-classic',
    name: 'Buscadis Clásico',
    description: 'Limpio y legible para cualquier escaparate',
    tier: 'free',
    config: {
      dotsColor: '#1e293b',
      backgroundColor: '#ffffff',
      dotType: 'square',
      cornerSquareType: 'square',
      cornerDotType: 'square',
      hideBackgroundDots: true,
      imageSize: 0.22,
    },
  },
  {
    id: 'brand-theme',
    name: 'Color de marca',
    description: 'Usa el color principal de tu negocio',
    tier: 'free',
    config: {
      dotType: 'square',
      cornerSquareType: 'square',
      cornerDotType: 'square',
      hideBackgroundDots: true,
      imageSize: 0.22,
    },
  },
  {
    id: 'instagram-soft',
    name: 'Suave',
    description: 'Puntos redondeados estilo Instagram',
    tier: 'pro',
    config: {
      dotsColor: '#0f172a',
      backgroundColor: '#ffffff',
      dotType: 'rounded',
      cornerSquareType: 'extra-rounded',
      cornerDotType: 'dot',
      hideBackgroundDots: true,
      imageSize: 0.35,
    },
  },
  {
    id: 'neon-gradient',
    name: 'Neón',
    description: 'Gradiente vibrante para redes sociales',
    tier: 'pro',
    config: {
      backgroundColor: '#0f172a',
      dotType: 'classy-rounded',
      cornerSquareType: 'extra-rounded',
      cornerDotType: 'dot',
      gradient: {
        type: 'linear',
        rotation: 45,
        colorStops: [
          { offset: 0, color: '#3b82f6' },
          { offset: 1, color: '#ec4899' },
        ],
      },
      hideBackgroundDots: true,
      imageSize: 0.35,
    },
  },
  {
    id: 'minimal-dots',
    name: 'Minimal',
    description: 'Puntos circulares sobre fondo claro',
    tier: 'pro',
    config: {
      dotsColor: '#334155',
      backgroundColor: '#f8fafc',
      dotType: 'dots',
      cornerSquareType: 'dot',
      cornerDotType: 'dot',
      hideBackgroundDots: true,
      imageSize: 0.3,
    },
  },
  {
    id: 'executive',
    name: 'Ejecutivo',
    description: 'Elegante para tarjetas y recepción',
    tier: 'pro',
    config: {
      dotsColor: '#1e3a5f',
      backgroundColor: '#ffffff',
      dotType: 'classy',
      cornerSquareType: 'extra-rounded',
      cornerDotType: 'square',
      hideBackgroundDots: true,
      imageSize: 0.32,
      frameText: 'Escanea para ver más',
      frameColor: '#1e3a5f',
    },
  },
];

export function getPresetById(id: string): QrPreset | undefined {
  return QR_PRESETS.find((p) => p.id === id);
}

export function buildFreeStyleConfig(themeColor?: string): QrStyleConfig {
  const preset = QR_PRESETS[0];
  return {
    ...preset.config,
    dotsColor: themeColor && /^#[0-9a-fA-F]{6}$/.test(themeColor) ? themeColor : '#1e293b',
    presetId: 'brand-theme',
  };
}
