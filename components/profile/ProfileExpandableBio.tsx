'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ProfileExpandableBioProps {
  text?: string;
  maxLines?: number;
  className?: string;
}

export default function ProfileExpandableBio({
  text,
  maxLines = 3,
  className,
}: ProfileExpandableBioProps) {
  const [expanded, setExpanded] = useState(false);
  if (!text?.trim()) return null;

  const needsExpand = text.length > 120;

  return (
    <div className={cn('max-w-6xl mx-auto px-4', className)}>
      <p
        className={cn(
          'text-sm text-[var(--text-secondary)] leading-relaxed m-0 whitespace-pre-line',
          !expanded && needsExpand && `line-clamp-${maxLines}`
        )}
        style={
          !expanded && needsExpand
            ? {
                display: '-webkit-box',
                WebkitLineClamp: maxLines,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }
            : undefined
        }
      >
        {text}
      </p>
      {needsExpand && !expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="text-sm font-semibold text-[var(--brand-color)] mt-1 hover:underline"
        >
          Ver más
        </button>
      )}
    </div>
  );
}
