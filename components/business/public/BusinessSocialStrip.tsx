'use client';

import type { BusinessProfile } from '@/types/business';
import { getHeroSocialLinks, socialLinkLabel } from '@/lib/business/social-display';
import { getSocialIcon } from './social-icons';
import { cn } from '@/lib/utils';

interface BusinessSocialStripProps {
  profile: Partial<BusinessProfile>;
  className?: string;
  /** Iconos compactos vs chips con etiqueta */
  variant?: 'icons' | 'chips';
}

export default function BusinessSocialStrip({
  profile,
  className,
  variant = 'chips',
}: BusinessSocialStripProps) {
  const links = getHeroSocialLinks(profile);
  if (links.length === 0) return null;

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2 print:hidden',
        variant === 'icons' ? 'gap-3' : 'gap-2',
        className
      )}
      aria-label="Redes sociales y enlaces"
    >
      {links.map((link, index) => {
        const label = socialLinkLabel(link);
        if (variant === 'icons') {
          return (
            <a
              key={`${link.url}-${index}`}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              title={label}
              aria-label={label}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-primary)]/90 text-[var(--text-secondary)] shadow-sm transition-all hover:border-[var(--brand-color)] hover:text-[var(--brand-color)] hover:scale-105"
            >
              {getSocialIcon(link.url)}
            </a>
          );
        }
        return (
          <a
            key={`${link.url}-${index}`}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-primary)]/90 px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] shadow-sm transition-all hover:border-[var(--brand-color)] hover:text-[var(--brand-color)]"
          >
            <span className="shrink-0">{getSocialIcon(link.url)}</span>
            <span className="truncate max-w-[140px]">{label}</span>
          </a>
        );
      })}
    </div>
  );
}
