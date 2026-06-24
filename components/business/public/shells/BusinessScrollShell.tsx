'use client';

import type { ReactNode } from 'react';
import type { ProfileBlock } from '@/types/business';
import type { BlockRenderContext } from '@/lib/business/blocks/types';
import type { HeroVariant } from '@/lib/business/templates/registry';
import BusinessActionBar from '@/components/business/public/BusinessActionBar';
import BusinessOwnerBanner from '@/components/business/public/BusinessOwnerBanner';

interface BusinessScrollShellProps {
  blocks: ProfileBlock[];
  ctx: BlockRenderContext;
  heroVariant: HeroVariant;
  renderBlock: (block: ProfileBlock) => ReactNode;
  isOwner?: boolean;
  canEdit?: boolean;
  isEditor?: boolean;
  isLoggedIn?: boolean;
  userEmail?: string | null;
  cartCount?: number;
  onShare?: () => void;
  onOpenCart?: () => void;
  onEditPart?: (part: string) => void;
  onOpenEditor?: () => void;
  onOpenQr?: () => void;
}

export default function BusinessScrollShell({
  blocks,
  ctx,
  renderBlock,
  isOwner,
  canEdit,
  isEditor,
  isLoggedIn,
  userEmail,
  cartCount,
  onShare,
  onOpenCart,
  onEditPart,
  onOpenEditor,
  onOpenQr,
}: BusinessScrollShellProps) {
  const heroIdx = blocks.findIndex((b) => b.type === 'hero');
  const heroBlock = heroIdx >= 0 ? blocks[heroIdx] : null;
  const afterHero = blocks.filter((_, i) => i !== heroIdx);

  return (
    <>
      {heroBlock && renderBlock(heroBlock)}
      <BusinessActionBar
        profile={ctx.profile}
        canEdit={canEdit ?? isOwner}
        isEditor={isEditor}
        cartCount={cartCount}
        onShare={onShare || (() => {})}
        onOpenCart={onOpenCart}
        onEditPart={onEditPart || ctx.onEditPart}
        onOpenEditor={onOpenEditor}
        onOpenQr={onOpenQr || ctx.onOpenQr}
        hideMobile={ctx.hideMobileActionBar}
      />
      <BusinessOwnerBanner
        profile={ctx.profile}
        canEdit={canEdit ?? isOwner}
        isEditor={isEditor}
        isLoggedIn={isLoggedIn}
        userEmail={userEmail}
        onOpenEditor={onOpenEditor}
        className="mb-3 md:pl-4"
      />
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-8">
        {afterHero.map((block) => (
          <section key={block.id} id={`block-${block.type}`}>
            {renderBlock(block)}
          </section>
        ))}
      </div>
    </>
  );
}
