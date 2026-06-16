'use client';

import { cn } from '@/lib/utils';
import type { PageTemplate } from '@/lib/business/templates/registry';

interface TemplatePreviewCardProps {
  template: PageTemplate;
  selected?: boolean;
  recommended?: boolean;
  onSelect: () => void;
}

export default function TemplatePreviewCard({
  template,
  selected,
  recommended,
  onSelect,
}: TemplatePreviewCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'text-left rounded-2xl border-2 overflow-hidden transition-all hover:shadow-lg',
        selected ? 'border-[var(--brand-color)] ring-2 ring-[var(--brand-color)]/20' : 'border-slate-200'
      )}
    >
      <div
        className={cn(
          'h-24 bg-gradient-to-br flex items-end p-3',
          template.thumbnailGradient
        )}
      >
        <span className="text-white text-xs font-bold uppercase opacity-80">
          {template.paradigm === 'scroll' ? 'Scroll' : 'Tabs'}
        </span>
      </div>
      <div className="p-3 bg-white">
        {recommended && (
          <span className="text-[10px] font-bold text-amber-600 uppercase mb-1 block">
            Recomendado para ti
          </span>
        )}
        <p className="font-bold text-sm text-slate-800">{template.label}</p>
        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{template.description}</p>
      </div>
    </button>
  );
}
