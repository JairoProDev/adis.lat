import type { ProfileComponentId } from './layout';

export interface StyleSkinTokens {
  id: string;
  label: string;
  color: string;
  mode: 'light' | 'dark';
  fontFamily: 'sans' | 'serif' | 'display';
  radius: 'sharp' | 'rounded' | 'pill';
  density: 'compact' | 'comfortable';
  accentStyle: 'solid' | 'gradient' | 'outline';
}

export interface ComponentStyleOverride {
  color?: string;
  fontSize?: 'sm' | 'md' | 'lg';
  visible?: boolean;
  icon?: string;
  [key: string]: unknown;
}

export interface ProfileStyleSchema {
  skinId: string;
  overrides?: Partial<Record<ProfileComponentId, ComponentStyleOverride>>;
}
