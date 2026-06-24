'use client';

import type { CustomBlock } from '@/types/business';
import { getSocialIcon } from './social-icons';
import { IconArrowRight } from '@/components/Icons';
import { cn } from '@/lib/utils';

interface BusinessCustomBlocksProps {
  blocks: CustomBlock[];
}

export default function BusinessCustomBlocks({ blocks }: BusinessCustomBlocksProps) {
  if (!blocks.length) return null;

  const linkBlocks = blocks.filter((b) => b.type !== 'text' || b.content);

  return (
    <div className="space-y-3">
      <h3 className="font-bold text-lg text-[var(--text-primary)]">Enlaces</h3>
      <div className="flex flex-col gap-2.5 max-w-lg mx-auto sm:mx-0">
        {linkBlocks.map((block) => {
          if (block.type === 'text') {
            return (
              <div
                key={block.id}
                className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]"
              >
                {block.label && <p className="font-bold text-sm mb-1">{block.label}</p>}
                <p className="text-sm text-[var(--text-secondary)]">{block.content}</p>
              </div>
            );
          }
          if (!block.content) return null;
          const filled = block.style === 'filled';
          return (
            <a
              key={block.id}
              href={block.content}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'group flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl border font-semibold text-sm transition-all hover:-translate-y-0.5 hover:shadow-md motion-reduce:transform-none',
                filled
                  ? 'bg-[var(--brand-color)] border-[var(--brand-color)] text-white'
                  : 'bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-primary)] hover:border-[var(--brand-color)]'
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className={filled ? 'text-white/90' : 'text-[var(--text-secondary)]'}>
                  {getSocialIcon(block.content)}
                </span>
                <div className="min-w-0 text-left">
                  <p className="font-bold truncate">{block.label || 'Enlace'}</p>
                  {block.sublabel && (
                    <p
                      className={cn(
                        'text-xs truncate font-normal',
                        filled ? 'text-white/75' : 'text-[var(--text-tertiary)]'
                      )}
                    >
                      {block.sublabel}
                    </p>
                  )}
                </div>
              </div>
              <IconArrowRight
                size={16}
                className={cn(
                  'shrink-0 transition-transform group-hover:translate-x-0.5',
                  filled ? 'text-white/80' : 'text-[var(--text-tertiary)] group-hover:text-[var(--brand-color)]'
                )}
              />
            </a>
          );
        })}
      </div>
    </div>
  );
}
