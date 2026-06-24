'use client';

import { useMemo, useState, useEffect } from 'react';
import type { BlockRenderContext } from '@/lib/business/blocks/types';
import { getVisibleBlocks, getDefaultTabId } from '@/lib/business/blocks/normalize';
import { renderProfileBlock } from '@/lib/business/blocks/registry';
import { getTemplateById } from '@/lib/business/templates/registry';
import type { CtaPlacement } from '@/lib/business/templates/registry';
import BusinessTabShell from '@/components/business/public/shells/BusinessTabShell';
import BusinessScrollShell from '@/components/business/public/shells/BusinessScrollShell';
import ProfileWireframeShell from '@/components/profile/ProfileWireframeShell';
import type { ProfileEditAccess } from '@/components/profile/ProfileChrome';
import { usesWireframeLayout } from '@/lib/profile/adapters/business-adapter';

interface BlockRendererEngineProps {
  ctx: BlockRenderContext;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
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
  onWhatsappClick?: () => void;
  editAccess?: ProfileEditAccess;
  onEditRequest?: () => void;
  ctaPlacement?: CtaPlacement;
}

export default function BlockRendererEngine({
  ctx,
  activeTab: controlledTab,
  onTabChange,
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
  onWhatsappClick,
  editAccess,
  onEditRequest,
  ctaPlacement = 'sticky_bar',
}: BlockRendererEngineProps) {
  const template = getTemplateById(ctx.profile.template_id || 'modern_tabs');
  const visibleBlocks = useMemo(() => getVisibleBlocks(ctx.blocks), [ctx.blocks]);
  const defaultTab = useMemo(() => getDefaultTabId(ctx.blocks), [ctx.blocks]);

  const [internalTab, setInternalTab] = useState(defaultTab);
  const activeTab = controlledTab ?? internalTab;
  const setActiveTab = onTabChange ?? setInternalTab;

  useEffect(() => {
    if (!controlledTab) {
      setInternalTab((prev) => {
        const tabs = visibleBlocks
          .filter((b) => !['hero', 'highlights', 'cta'].includes(b.type))
          .map((b) => getDefaultTabId([b]))
          .filter(Boolean);
        if (tabs.includes(prev)) return prev;
        return defaultTab;
      });
    }
  }, [defaultTab, controlledTab, visibleBlocks]);

  const heroVariant = template.heroVariant;
  const hideStickyCta = ctaPlacement === 'floating' || ctx.hideMobileActionBar;
  const shellProps = {
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
    onWhatsappClick,
    editAccess,
    onEditRequest,
  };

  const renderBlockFn = (block: Parameters<typeof renderProfileBlock>[0]) =>
    renderProfileBlock(block, ctx, heroVariant, { hideStickyCta });

  if (usesWireframeLayout(ctx.profile)) {
    return (
      <ProfileWireframeShell
        ctx={ctx}
        renderBlock={renderBlockFn}
        {...shellProps}
      />
    );
  }

  if (template.paradigm === 'scroll') {
    return (
      <BusinessScrollShell
        blocks={visibleBlocks}
        ctx={ctx}
        heroVariant={heroVariant}
        renderBlock={(block) => renderProfileBlock(block, ctx, heroVariant, { hideStickyCta })}
        {...shellProps}
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
      renderBlock={(block) => renderProfileBlock(block, ctx, heroVariant, { hideStickyCta })}
      {...shellProps}
    />
  );
}
