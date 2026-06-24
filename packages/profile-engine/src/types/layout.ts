import type { MetricKey } from './entity';

export type ProfileComponentId =
  | 'profile_chrome'
  | 'profile_hero'
  | 'profile_metrics'
  | 'profile_identity'
  | 'profile_social_strip'
  | 'profile_bio'
  | 'profile_hashtags'
  | 'profile_social_proof'
  | 'profile_story_highlights'
  | 'profile_sections'
  | 'profile_search'
  | 'profile_content'
  | 'profile_sticky_cta';

export interface ComponentSlotConfig {
  keys?: MetricKey[];
  variant?: string;
  [key: string]: unknown;
}

export interface ComponentSlot {
  id: string;
  component: ProfileComponentId;
  visible: boolean;
  order: number;
  variant?: string;
  config?: ComponentSlotConfig;
}

export interface ProfileBackground {
  type: 'color' | 'gradient' | 'image';
  value: string;
}

export interface ProfileLayoutSchema {
  structureTemplateId: string;
  styleSkinId: string;
  background?: ProfileBackground;
  slots: ComponentSlot[];
}
