'use client';

import { useMemo, useState } from 'react';
import type { BlockRenderContext } from '@/lib/business/blocks/types';
import { getVisibleBlocks } from '@/lib/business/blocks/normalize';
import { renderProfileBlock } from '@/lib/business/blocks/registry';
import { getTemplateById } from '@/lib/business/templates/registry';
import BusinessTabShell from '@/components/business/public/shells/BusinessTabShell';
import BusinessScrollShell from '@/components/business/public/shells/BusinessScrollShell';

interface BlockRendererEngineProps {
  ctx: BlockRenderContext;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  isOwner?: boolean;
  cartCount?: number;
  onShare?: () => void;
  onOpenCart?: () => void;
  onEditPart?: (part: string) => void;
}

export default function BlockRendererEngine({
  ctx,
  activeTab: controlledTab,
  onTabChange,
  isOwner,
  cartCount,
  onShare,
  onOpenCart,
  onEditPart,
}: BlockRendererEngineProps) {
  const [internalTab, setInternalTab] = useState('catalogo');
  const activeTab = controlledTab ?? internalTab;
  const setActiveTab = onTabChange ?? setInternalTab;

  const template = getTemplateById(ctx.profile.template_id || 'modern_tabs');
  const visibleBlocks = useMemo(
    () => getVisibleBlocks(ctx.blocks),
    [ctx.blocks]
  );

  const heroVariant = template.heroVariant;

  if (template.paradigm === 'scroll') {
    return (
      <BusinessScrollShell
        blocks={visibleBlocks}
        ctx={ctx}
        heroVariant={heroVariant}
        renderBlock={(block) => renderProfileBlock(block, ctx, heroVariant)}
        isOwner={isOwner}
        cartCount={cartCount}
        onShare={onShare}
        onOpenCart={onOpenCart}
        onEditPart={onEditPart}
      />
    );
  }

  return (
    <BusinessTabShell
      blocks={visibleBlocks}
      ctx={ctx}
      heroVariant={heroVariant}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      adisosCount={ctx.adisos.length}
      renderBlock={(block) => renderProfileBlock(block, ctx, heroVariant)}
      isOwner={isOwner}
      cartCount={cartCount}
      onShare={onShare}
      onOpenCart={onOpenCart}
      onEditPart={onEditPart}
    />
  );
}
