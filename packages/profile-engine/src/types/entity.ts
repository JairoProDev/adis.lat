export type ProfileKind = 'business' | 'person';

export type MetricKey =
  | 'interactions'
  | 'sales'
  | 'clients'
  | 'followers'
  | 'content_count'
  | 'reviews'
  | 'views'
  | 'products';

export interface ProfileMetricValue {
  key: MetricKey;
  value: number;
  label: string;
}

export interface ProfileSocialLink {
  network: string;
  url: string;
  label?: string;
}

export interface ProfileLocation {
  address?: string;
  district?: string;
  city?: string;
  region?: string;
  country?: string;
  countryCode?: string;
}

export type LocationDisplayLevel =
  | 'address'
  | 'district'
  | 'city'
  | 'region'
  | 'country';

export interface ProfileReviewSummary {
  avgRating: number;
  reviewCount: number;
}

export interface StoryHighlight {
  id: string;
  title: string;
  coverUrl?: string;
  linkUrl?: string;
}

export interface SocialInsight {
  id: string;
  userName: string;
  avatarUrl?: string;
  action: string;
}

export interface ProfileEntity {
  kind: ProfileKind;
  id: string;
  handle: string;
  displayName: string;
  tagline?: string;
  description?: string;
  avatarUrl?: string;
  bannerImageUrl?: string;
  isVerified?: boolean;
  websiteUrl?: string;
  socialLinks: ProfileSocialLink[];
  location?: ProfileLocation;
  locationDisplayLevel?: LocationDisplayLevel;
  hashtags?: string[];
  storyHighlights?: StoryHighlight[];
  metrics?: ProfileMetricValue[];
  reviewSummary?: ProfileReviewSummary;
  contactWhatsapp?: string;
}
