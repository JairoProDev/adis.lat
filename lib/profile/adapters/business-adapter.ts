import type {
  BusinessProfile,
  BusinessReviewAggregate,
  MetricsConfig,
  StoryHighlight,
} from '@/types/business';
import type {
  ProfileEntity,
  ProfileMetricValue,
  MetricKey,
  StoryHighlight as EngineHighlight,
  ProfileSocialLink,
  ProfileLayoutSchema as EngineLayoutSchema,
  ProfileStyleSchema as EngineStyleSchema,
} from '@buscadis/profile-engine';
import { METRIC_LABELS, mergeProfileLayout } from '@buscadis/profile-engine';
import { getPublicadisSiteUrl } from '@/lib/business/publicadis';
import { parseLocationFromAddress } from '@/lib/profile/resolve-location-display';

function toSocialLinks(profile: Partial<BusinessProfile>): ProfileSocialLink[] {
  const links: ProfileSocialLink[] = [];
  const website = getPublicadisSiteUrl(profile);
  if (website) {
    links.push({ network: 'website', url: website, label: 'Sitio web' });
  }
  for (const l of profile.social_links || []) {
    if (l.url?.includes('publicadis.com') && website) continue;
    links.push({
      network: l.network,
      url: l.url,
      label: l.label,
    });
  }
  return links;
}

function toHighlights(items?: StoryHighlight[]): EngineHighlight[] {
  if (!Array.isArray(items)) return [];
  return items.map((h) => ({
    id: h.id,
    title: h.title,
    coverUrl: h.cover_url,
    linkUrl: h.link_url,
  }));
}

export function buildBusinessMetrics(
  profile: Partial<BusinessProfile>,
  reviewAggregate?: BusinessReviewAggregate | null,
  productCount = 0,
  config?: MetricsConfig | null
): ProfileMetricValue[] {
  const keys: MetricKey[] =
    config?.keys?.length ? config.keys.slice(0, 3) : ['views', 'products', 'reviews'];

  const values: Record<MetricKey, number> = {
    interactions: profile.view_count ?? 0,
    sales: 0,
    clients: 0,
    followers: 0,
    content_count: productCount,
    reviews: reviewAggregate?.review_count ?? 0,
    views: profile.view_count ?? 0,
    products: productCount,
  };

  return keys.map((key) => ({
    key,
    value: values[key] ?? 0,
    label: METRIC_LABELS[key] || key,
  }));
}

export function businessProfileToEntity(
  profile: Partial<BusinessProfile>,
  opts?: {
    reviewAggregate?: BusinessReviewAggregate | null;
    productCount?: number;
  }
): ProfileEntity {
  const location = parseLocationFromAddress(profile.contact_address);
  return {
    kind: 'business',
    id: profile.id || '',
    handle: profile.slug || '',
    displayName: profile.name || '',
    tagline: profile.tagline,
    description: profile.description,
    avatarUrl: profile.logo_url,
    bannerImageUrl: profile.banner_url,
    isVerified: profile.is_verified,
    websiteUrl: getPublicadisSiteUrl(profile) || undefined,
    socialLinks: toSocialLinks(profile),
    location,
    locationDisplayLevel: profile.location_display_level || 'city',
    hashtags: profile.profile_hashtags || [],
    storyHighlights: toHighlights(profile.story_highlights),
    metrics: buildBusinessMetrics(
      profile,
      opts?.reviewAggregate,
      opts?.productCount ?? 0,
      profile.metrics_config
    ),
    reviewSummary: opts?.reviewAggregate
      ? {
          avgRating: opts.reviewAggregate.avg_rating,
          reviewCount: opts.reviewAggregate.review_count,
        }
      : undefined,
    contactWhatsapp: profile.contact_whatsapp,
  };
}

export function resolveBusinessProfileLayout(
  profile: Partial<BusinessProfile>
): EngineLayoutSchema {
  return mergeProfileLayout(
    profile.profile_layout as EngineLayoutSchema | null,
    'social_wireframe_v1'
  );
}

export function resolveBusinessProfileStyle(
  profile: Partial<BusinessProfile>
): EngineStyleSchema {
  return (profile.profile_style as EngineStyleSchema) || { skinId: profile.theme_preset || 'buscadis_default' };
}

export function usesWireframeLayout(profile: Partial<BusinessProfile>): boolean {
  const layout = profile.profile_layout as EngineLayoutSchema | null | undefined;
  if (!layout?.structureTemplateId) return true;
  return ['social_wireframe_v1', 'minimal_identity'].includes(layout.structureTemplateId);
}
