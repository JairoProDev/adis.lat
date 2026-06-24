'use client';

import { cn } from '@/lib/utils';

interface ProfileHashtagsProps {
  tags?: string[];
  className?: string;
}

export default function ProfileHashtags({ tags, className }: ProfileHashtagsProps) {
  if (!tags?.length) return null;

  return (
    <div
      className={cn(
        'max-w-6xl mx-auto px-4 flex flex-wrap gap-2 print:hidden',
        className
      )}
    >
      {tags.map((tag) => {
        const label = tag.startsWith('#') ? tag : `#${tag}`;
        return (
          <span
            key={label}
            className="text-xs font-semibold text-[var(--brand-color)] bg-[var(--brand-color)]/10 px-2.5 py-1 rounded-full"
          >
            {label}
          </span>
        );
      })}
    </div>
  );
}
