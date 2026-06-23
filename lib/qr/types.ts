export type QrStyleTier = 'free' | 'pro';

export type QrDotType = 'square' | 'dots' | 'rounded' | 'classy' | 'classy-rounded' | 'extra-rounded';

export type QrCornerSquareType = 'square' | 'dot' | 'extra-rounded';

export type QrCornerDotType = 'square' | 'dot';

export interface QrGradientStop {
  offset: number;
  color: string;
}

export interface QrStyleConfig {
  dotsColor?: string;
  backgroundColor?: string;
  dotType?: QrDotType;
  cornerSquareType?: QrCornerSquareType;
  cornerDotType?: QrCornerDotType;
  gradient?: {
    type: 'linear' | 'radial';
    rotation?: number;
    colorStops: QrGradientStop[];
  };
  logoUrl?: string;
  hideBackgroundDots?: boolean;
  imageSize?: number;
  frameText?: string;
  frameColor?: string;
  presetId?: string;
}

export interface QrCodeRecord {
  id: string;
  business_profile_id: string;
  short_code: string;
  destination_type: string;
  destination_slug: string | null;
  is_active: boolean;
  style_tier: QrStyleTier;
  style_config: QrStyleConfig;
  scan_count: number;
  created_at: string;
  updated_at: string;
}

export type QrKitTemplate =
  | 'flyer-basic'
  | 'story'
  | 'table-tent'
  | 'sticker'
  | 'poster'
  | 'business-card';

export type SubscriptionTier = 'free' | 'pro' | 'enterprise';
