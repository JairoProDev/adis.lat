import {
  IconFacebook,
  IconGlobe,
  IconInstagram,
  IconLinkedin,
  IconTiktok,
  IconWhatsapp,
  IconYoutube,
} from '@/components/Icons';
import type { SocialBrandKey } from '@/lib/business/social-display';
import { FaFacebookMessenger, FaTelegram, FaTwitter, FaPinterest, FaSpotify } from 'react-icons/fa';
import type { ReactNode } from 'react';

function iconProps(size: number) {
  return { size, color: 'currentColor' as const, className: 'shrink-0' };
}

export function getSocialIconByBrand(brand: SocialBrandKey, size = 20): ReactNode {
  const p = iconProps(size);
  switch (brand) {
    case 'whatsapp':
      return <IconWhatsapp {...p} />;
    case 'telegram':
      return <FaTelegram {...p} />;
    case 'messenger':
      return <FaFacebookMessenger {...p} />;
    case 'instagram':
      return <IconInstagram {...p} />;
    case 'facebook':
      return <IconFacebook {...p} />;
    case 'tiktok':
      return <IconTiktok {...p} />;
    case 'linkedin':
      return <IconLinkedin {...p} />;
    case 'youtube':
      return <IconYoutube {...p} />;
    case 'twitter':
      return <FaTwitter {...p} />;
    case 'pinterest':
      return <FaPinterest {...p} />;
    case 'spotify':
      return <FaSpotify {...p} />;
    case 'threads':
      return <FaTwitter {...p} />;
    case 'website':
      return <IconGlobe {...p} />;
    default:
      return <IconGlobe {...p} />;
  }
}

/** @deprecated prefer getSocialIconByBrand */
export function getSocialIcon(url: string, opts?: { size?: number; brand?: SocialBrandKey }) {
  const size = opts?.size ?? 20;
  if (opts?.brand) return getSocialIconByBrand(opts.brand, size);

  const lower = url.toLowerCase();
  if (lower.includes('wa.me') || lower.includes('whatsapp')) return getSocialIconByBrand('whatsapp', size);
  if (lower.includes('t.me') || lower.includes('telegram')) return getSocialIconByBrand('telegram', size);
  if (lower.includes('m.me') || lower.includes('messenger')) return getSocialIconByBrand('messenger', size);
  if (lower.includes('facebook') || lower.includes('fb.com')) return getSocialIconByBrand('facebook', size);
  if (lower.includes('instagram')) return getSocialIconByBrand('instagram', size);
  if (lower.includes('tiktok')) return getSocialIconByBrand('tiktok', size);
  if (lower.includes('linkedin')) return getSocialIconByBrand('linkedin', size);
  if (lower.includes('youtube') || lower.includes('youtu.be')) return getSocialIconByBrand('youtube', size);
  if (lower.includes('twitter') || lower.includes('x.com')) return getSocialIconByBrand('twitter', size);
  if (lower.includes('pinterest')) return getSocialIconByBrand('pinterest', size);
  if (lower.includes('spotify')) return getSocialIconByBrand('spotify', size);
  return getSocialIconByBrand('website', size);
}
