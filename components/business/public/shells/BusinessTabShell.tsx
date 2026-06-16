'use client';

import type { ReactNode } from 'react';
import type { ProfileBlock } from '@/types/business';
import type { BlockRenderContext } from '@/lib/business/blocks/types';
import type { HeroVariant } from '@/lib/business/templates/registry';
import { blockTypeToTabId } from '@/lib/business/blocks/normalize';
import { cn } from '@/lib/utils';
import {
  IconStore,
  IconMapMarkerAlt,
  IconHeart,
  IconStar,
} from '@/components/Icons';
import HeroRenderer from '@/components/business/public/heroes/HeroRenderer';
import BusinessActionBar from '@/components/business/public/BusinessActionBar';

const TAB_META: Record<string, { label: string; icon: ReactNode }> = {
  catalogo: { label: 'Catálogo', icon: <IconStore size={18} /> },
  inicio: { label: 'Información', icon: <IconMapMarkerAlt size={18} /> },
  feed: { label: 'Deals', icon: <IconHeart size={18} /> },
  resenas: { label: 'Reseñas', icon: <IconStar size={18} /> },
};

interface BusinessTabShellProps {
  blocks: ProfileBlock[];
  ctx: BlockRenderContext;
  heroVariant: HeroVariant;
  activeTab: string;
  onTabChange: (tab: string) => void;
  adisosCount: number;
  renderBlock: (block: ProfileBlock) => ReactNode;
  isOwner?: boolean;
  cartCount?: number;
  onShare?: () => void;
  onOpenCart?: () => void;
  onEditPart?: (part: string) => void;
}

export default function BusinessTabShell({
  blocks,
  ctx,
  heroVariant,
  activeTab,
  onTabChange,
  adisosCount,
  renderBlock,
  isOwner,
  cartCount,
  onShare,
  onOpenCart,
  onEditPart,
}: BusinessTabShellProps) {
  const heroBlock = blocks.find((b) => b.type === 'hero');
  const highlightsBlock = blocks.find((b) => b.type === 'highlights');
  const contentBlocks = blocks.filter((b) => !['hero', 'highlights', 'cta'].includes(b.type));

  const tabs = Array.from(
    new Set(
      contentBlocks
        .map((b) => blockTypeToTabId(b.type))
        .filter((t): t is string => Boolean(t))
    )
  );

  const blocksForTab = contentBlocks.filter(
    (b) => blockTypeToTabId(b.type) === activeTab
  );

  return (
    <>
      {heroBlock?.visible && (
        <HeroRenderer
          variant={heroVariant}
          profile={ctx.profile}
          showEditControls={ctx.showEditControls}
          onEditPart={ctx.onEditPart}
        />
      )}
      {highlightsBlock?.visible &&
        renderBlock(highlightsBlock)}
      <BusinessActionBar
        profile={ctx.profile}
        isOwner={isOwner}
        cartCount={cartCount}
        onShare={onShare || (() => {})}
        onOpenCart={onOpenCart}
        onEditPart={onEditPart || ctx.onEditPart}
      />
      <div className="bg-[var(--bg-primary)] pb-2 shadow-sm relative z-10">
        <div className="mt-8 border-t border-[var(--border-subtle)] bg-[var(--bg-primary)] sticky top-0 z-40 shadow-sm backdrop-blur-md print:hidden">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center gap-8 overflow-x-auto no-scrollbar">
              {tabs.map((tabId) => {
                const meta = TAB_META[tabId] || { label: tabId, icon: null };
                return (
                  <button
                    key={tabId}
                    type="button"
                    onClick={() => onTabChange(tabId)}
                    className={cn(
                      'flex items-center gap-2 py-4 px-2 font-bold text-sm whitespace-nowrap border-b-2 transition-all',
                      activeTab === tabId
                        ? 'text-[var(--brand-color)] border-[var(--brand-color)]'
                        : 'text-[var(--text-tertiary)] border-transparent'
                    )}
                  >
                    {meta.icon}
                    {meta.label}
                    {tabId === 'catalogo' && (
                      <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-[var(--bg-secondary)]">
                        {adisosCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-8 min-h-[50vh]">
        {blocksForTab.map((b) => renderBlock(b))}
      </div>
      {blocks
        .filter((b) => b.type === 'cta')
        .map((b) => renderBlock(b))}
    </>
  );
}
