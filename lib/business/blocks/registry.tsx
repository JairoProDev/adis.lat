'use client';

import type { ReactNode } from 'react';
import type { ProfileBlock } from '@/types/business';
import type { BlockRenderContext } from '@/lib/business/blocks/types';
import BusinessHighlights from '@/components/business/public/BusinessHighlights';
import BusinessCatalogTab from '@/components/business/public/BusinessCatalogTab';
import BusinessDealsTab from '@/components/business/public/BusinessDealsTab';
import BusinessReviewsTab from '@/components/business/public/BusinessReviewsTab';
import BusinessInfoTab from '@/components/business/public/BusinessInfoTab';
import BusinessCustomBlocks from '@/components/business/public/BusinessCustomBlocks';
import HeroRenderer from '@/components/business/public/heroes/HeroRenderer';
import type { HeroVariant } from '@/lib/business/templates/registry';
import { getWhatsappUrl } from '@/lib/business/public-utils';
import { IconWhatsapp } from '@/components/Icons';

export function renderProfileBlock(
  block: ProfileBlock,
  ctx: BlockRenderContext,
  heroVariant: HeroVariant
): ReactNode {
  if (!block.visible) return null;

  const { profile, adisos, catalogProducts, showEditControls, onEditPart, onEditProduct, addItem } = ctx;
  const catalogView =
    (block.config.viewMode as 'grid' | 'list' | 'feed' | undefined) ||
    ctx.defaultCatalogView ||
    'grid';

  switch (block.type) {
    case 'hero':
      return (
        <HeroRenderer
          key={block.id}
          variant={heroVariant}
          profile={profile}
          showEditControls={showEditControls}
          onEditPart={onEditPart}
        />
      );
    case 'highlights':
      return (
        <BusinessHighlights
          key={block.id}
          announcementText={profile.announcement_text}
          announcementActive={profile.announcement_active}
          customBlocks={profile.custom_blocks}
        />
      );
    case 'catalog':
      return (
        <BusinessCatalogTab
          key={block.id}
          profile={profile}
          adisos={adisos}
          catalogProducts={catalogProducts}
          showEditControls={showEditControls}
          onEditProduct={onEditProduct}
          onEditPart={onEditPart}
          addItem={addItem}
          defaultViewMode={catalogView}
          visible
        />
      );
    case 'deals':
      return profile.slug ? (
        <BusinessDealsTab
          key={block.id}
          slug={profile.slug}
          businessName={profile.name || 'Negocio'}
        />
      ) : null;
    case 'links':
      return profile.custom_blocks?.length ? (
        <div key={block.id} className="max-w-6xl mx-auto px-4 py-4">
          <BusinessCustomBlocks blocks={profile.custom_blocks} />
        </div>
      ) : null;
    case 'reviews':
      return profile.slug ? (
        <BusinessReviewsTab key={block.id} slug={profile.slug} />
      ) : null;
    case 'map':
      return (
        <div key={block.id} className="max-w-6xl mx-auto px-4 py-8">
          <BusinessInfoTab profile={profile} adisos={adisos} />
        </div>
      );
    case 'text': {
      const markdown = (block.config.markdown as string) || '';
      if (!markdown) return null;
      return (
        <div key={block.id} className="max-w-2xl mx-auto px-4 py-6">
          <div className="bg-[var(--bg-primary)] rounded-2xl p-6 border border-[var(--border-subtle)] text-[var(--text-secondary)] text-sm leading-relaxed whitespace-pre-wrap">
            {markdown}
          </div>
        </div>
      );
    }
    case 'embed': {
      const url = (block.config.url as string) || '';
      if (!url) return null;
      const safe = url.startsWith('https://') ? url : null;
      if (!safe) return null;
      return (
        <div key={block.id} className="max-w-4xl mx-auto px-4 py-6">
          <iframe
            title="Embed"
            src={safe}
            className="w-full aspect-video rounded-2xl border border-[var(--border-subtle)]"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      );
    }
    case 'cta':
      return profile.contact_whatsapp ? (
        <div key={block.id} className="sticky bottom-0 z-40 bg-[var(--bg-primary)] border-t border-[var(--border-subtle)] p-4 print:hidden">
          <a
            href={getWhatsappUrl(profile.contact_whatsapp, profile.name || 'Negocio')}
            target="_blank"
            rel="noreferrer"
            className="max-w-md mx-auto flex items-center justify-center gap-2 bg-green-500 text-white py-3 rounded-xl font-bold"
          >
            <IconWhatsapp size={20} /> Contáctanos por WhatsApp
          </a>
        </div>
      ) : null;
    default:
      return null;
  }
}
