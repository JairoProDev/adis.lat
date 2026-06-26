'use client';

import type { BusinessProfile } from '@/types/business';
import {
  getHeroSocialLinks,
  getWireframeSocialLinks,
  getSocialBrandKey,
  SOCIAL_BRAND_BUTTON_CLASS,
  socialLinkLabel,
} from '@/lib/business/social-display';
import { getSocialIconByBrand } from './social-icons';
import { cn } from '@/lib/utils';

interface BusinessSocialStripProps {
  profile: Partial<BusinessProfile>;
  className?: string;
  /** Iconos compactos vs chips con etiqueta */
  variant?: 'icons' | 'chips' | 'wireframe';
}

export default function BusinessSocialStrip({
  profile,
  className,
  variant = 'chips',
}: BusinessSocialStripProps) {
  const links =
    variant === 'wireframe' ? getWireframeSocialLinks(profile) : getHeroSocialLinks(profile);
  if (links.length === 0) return null;

  const isWireframe = variant === 'wireframe';
  const isIcons = variant === 'icons';

  return (
    <div
      className={cn(
        'flex flex-wrap items-stretch print:hidden',
        isWireframe ? 'gap-2 sm:gap-3' : isIcons ? 'gap-3 items-center' : 'gap-2 items-center',
        className
      )}
      aria-label="Redes sociales y enlaces"
    >
      {links.map((link, index) => {
        const label = socialLinkLabel(link);
        const brand = getSocialBrandKey(link);

        if (isWireframe) {
          const styles = SOCIAL_BRAND_BUTTON_CLASS[brand];
          return (
            <a
              key={`${link.url}-${index}`}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'group flex flex-col items-center justify-center gap-1 min-w-[5.5rem] sm:min-w-0',
                'md:flex-row md:gap-2.5 rounded-xl px-3 py-2.5 md:py-2 md:px-4',
                'text-[11px] sm:text-xs font-bold transition-all duration-200',
                styles.base,
                styles.hover
              )}
            >
              <span className="shrink-0 flex items-center justify-center text-current">
                {getSocialIconByBrand(brand, 20)}
              </span>
              <span className="text-center md:text-left leading-tight max-w-[88px] md:max-w-none truncate">
                {label}
              </span>
            </a>
          );
        }

        if (isIcons) {
          return (
            <a
              key={`${link.url}-${index}`}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              title={label}
              aria-label={label}
              className="flex items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-primary)]/90 text-[var(--text-secondary)] shadow-sm transition-all hover:border-[var(--brand-color)] hover:text-[var(--brand-color)] hover:scale-105 h-10 w-10"
            >
              {getSocialIconByBrand(brand, 18)}
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
            <span className="shrink-0">{getSocialIconByBrand(brand)}</span>
            <span className="truncate max-w-[140px]">{label}</span>
          </a>
        );
      })}
    </div>
  );
}
