'use client';

import type { StoryHighlight } from '@buscadis/profile-engine';
import { cn } from '@/lib/utils';

interface ProfileStoryHighlightsProps {
  highlights: StoryHighlight[];
  className?: string;
}

export default function ProfileStoryHighlights({
  highlights,
  className,
}: ProfileStoryHighlightsProps) {
  if (!highlights.length) return null;

  return (
    <div className={cn('max-w-6xl mx-auto px-4 print:hidden', className)}>
      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-1 snap-x snap-mandatory">
        {highlights.map((h) => {
          const inner = (
            <>
              <div className="w-16 h-16 sm:w-[4.5rem] sm:h-[4.5rem] rounded-full p-[2px] bg-gradient-to-tr from-[var(--brand-color)] to-pink-500">
                <div className="w-full h-full rounded-full border-2 border-[var(--bg-secondary)] overflow-hidden bg-[var(--bg-secondary)]">
                  {h.coverUrl ? (
                    <img src={h.coverUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-lg font-bold text-[var(--brand-color)]">
                      {h.title.charAt(0)}
                    </div>
                  )}
                </div>
              </div>
              <span className="text-[11px] text-[var(--text-secondary)] font-medium truncate max-w-[4.5rem] text-center">
                {h.title}
              </span>
            </>
          );

          if (h.linkUrl) {
            return (
              <a
                key={h.id}
                href={h.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1 shrink-0 snap-start"
              >
                {inner}
              </a>
            );
          }

          return (
            <div key={h.id} className="flex flex-col items-center gap-1 shrink-0 snap-start">
              {inner}
            </div>
          );
        })}
      </div>
    </div>
  );
}
