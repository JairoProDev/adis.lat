import {
  IconFacebook,
  IconGlobe,
  IconInstagram,
  IconLinkedin,
  IconTiktok,
  IconYoutube,
} from '@/components/Icons';

export function getSocialIcon(url: string, opts?: { size?: number }) {
  const size = opts?.size ?? 20;
  if (url.includes('facebook')) return <IconFacebook size={size} />;
  if (url.includes('instagram')) return <IconInstagram size={size} />;
  if (url.includes('tiktok')) return <IconTiktok size={size} />;
  if (url.includes('linkedin')) return <IconLinkedin size={size} />;
  if (url.includes('youtube')) return <IconYoutube size={size} />;
  return <IconGlobe size={size} />;
}
