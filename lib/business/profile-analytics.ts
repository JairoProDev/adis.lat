'use client';

import { trackEvent } from '@/lib/events/track';

export function trackTemplateApplied(templateId: string, policy: string, businessId?: string) {
  trackEvent('publish.draft_update', {
    entityType: 'publish_draft',
    entityId: businessId,
    payload: { action: 'template_applied', templateId, policy },
  });
}

export function trackBlockReordered(blockId: string, businessId?: string) {
  trackEvent('publish.draft_update', {
    entityType: 'publish_draft',
    entityId: businessId,
    payload: { action: 'block_reordered', blockId },
  });
}

export function trackThemeChanged(themePreset: string, businessId?: string) {
  trackEvent('publish.draft_update', {
    entityType: 'publish_draft',
    entityId: businessId,
    payload: { action: 'theme_changed', themePreset },
  });
}

export function trackBuilderModeChanged(mode: string, businessId?: string) {
  trackEvent('publish.step_view', {
    entityType: 'publish_draft',
    entityId: businessId,
    payload: { step: `builder_${mode}` },
  });
}
