import type { BusinessProfile, CustomBlock, SocialLink } from '@/types/business';
import { normalizeSocialLinks } from '@/lib/business/normalize-profile';
import { getPublicadisSiteUrl, getBuscadisProfileUrl } from '@/lib/business/publicadis';

const NETWORK_LABELS: Record<SocialLink['network'], string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  tiktok: 'TikTok',
  twitter: 'X / Twitter',
  linkedin: 'LinkedIn',
  custom: 'Enlace',
};

function isDuplicateActionBarLink(url: string, profile: Partial<BusinessProfile>): boolean {
  const publicadis = getPublicadisSiteUrl(profile);
  const buscadis = getBuscadisProfileUrl(profile);
  const normalized = url.trim().toLowerCase();
  if (publicadis && normalized === publicadis.toLowerCase()) return true;
  if (buscadis && normalized === buscadis.toLowerCase()) return true;
  return false;
}

/** Redes visibles en hero (excluye sitio web ya en action bar) */
export function getHeroSocialLinks(profile: Partial<BusinessProfile>): SocialLink[] {
  const links = normalizeSocialLinks(profile.social_links);
  return links.filter((link) => {
    if (!link.url?.trim()) return false;
    if (isDuplicateActionBarLink(link.url, profile)) return false;
    const label = (link.label || '').toLowerCase();
    if (label.includes('buscadis')) return false;
    return true;
  });
}

/** Strip del wireframe: Publicadis primero, luego redes sociales */
export function getWireframeSocialLinks(profile: Partial<BusinessProfile>): SocialLink[] {
  const links: SocialLink[] = [];
  const publicadis = getPublicadisSiteUrl(profile);
  if (publicadis) {
    links.push({
      network: 'custom',
      url: publicadis,
      label: 'Sitio web',
    });
  }
  for (const link of getHeroSocialLinks(profile)) {
    if (link.url?.includes('publicadis.com')) continue;
    const label = (link.label || '').toLowerCase();
    if (label.includes('publicadis') || label.includes('sitio web')) continue;
    links.push(link);
  }
  return links;
}

export function socialLinkLabel(link: SocialLink): string {
  if (link.label?.trim()) return link.label.trim();
  return NETWORK_LABELS[link.network] || 'Enlace';
}

export function socialLinksToCustomBlocks(links: SocialLink[]): CustomBlock[] {
  return links.map((link, index) => ({
    id: `social-derived-${index}`,
    type: 'link' as const,
    label: socialLinkLabel(link),
    content: link.url,
    style: 'default' as const,
  }));
}

/** Bloques linktree: custom_blocks o derivados de social_links */
export function resolveLinktreeBlocks(profile: Partial<BusinessProfile>): CustomBlock[] {
  const custom = profile.custom_blocks?.filter((b) => b.content || b.type === 'text') ?? [];
  if (custom.length > 0) return custom;
  return socialLinksToCustomBlocks(getHeroSocialLinks(profile));
}

export function profileIsOrphan(profile: Partial<BusinessProfile>): boolean {
  return !profile.user_id;
}
