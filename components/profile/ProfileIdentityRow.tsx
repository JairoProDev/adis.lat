'use client';

import type { ProfileEntity } from '@buscadis/profile-engine';
import { IconMapMarkerAlt, IconStar, IconVerified } from '@/components/Icons';
import { resolveLocationDisplayText } from '@/lib/profile/resolve-location-display';
import { cn } from '@/lib/utils';

interface ProfileIdentityRowProps {
  entity: ProfileEntity;
  className?: string;
}

export default function ProfileIdentityRow({ entity, className }: ProfileIdentityRowProps) {
  const { text: locationText, flag } = resolveLocationDisplayText(
    entity.location,
    entity.locationDisplayLevel,
    entity.location?.address
  );
  const rating = entity.reviewSummary;

  return (
    <div className={cn('max-w-6xl mx-auto px-4 space-y-1.5', className)}>
      <div className="flex items-start justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-black text-[var(--text-primary)] m-0 flex items-center gap-1.5 min-w-0">
          <span className="truncate">{entity.displayName}</span>
          {entity.isVerified && (
            <IconVerified size={20} className="shrink-0 text-sky-500" aria-label="Verificado" />
          )}
        </h1>
        {rating && rating.reviewCount > 0 && (
          <div className="flex items-center gap-1 shrink-0 text-sm font-semibold text-[var(--text-secondary)]">
            <IconStar size={16} className="text-amber-500" />
            <span>{rating.avgRating.toFixed(2)}</span>
            <span className="text-[var(--text-tertiary)] font-normal">({rating.reviewCount})</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 text-sm">
        {entity.tagline && (
          <p className="text-[var(--text-tertiary)] font-medium m-0 truncate">{entity.tagline}</p>
        )}
        {locationText && (
          <div className="flex items-center gap-1 shrink-0 text-[var(--text-tertiary)] text-xs sm:text-sm max-w-[50%]">
            {flag && <span aria-hidden>{flag}</span>}
            <IconMapMarkerAlt size={14} className="shrink-0 text-[var(--brand-color)]" />
            <span className="truncate">{locationText}</span>
          </div>
        )}
      </div>
    </div>
  );
}
