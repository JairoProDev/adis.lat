'use client';

import { getAnonymousId, getSessionId } from '@/lib/events/session';
import { trackEvent } from '@/lib/events';

export interface DemandIntentPayload {
  queryText: string;
  categoria?: string;
  facets?: Record<string, unknown>;
  ubicacion?: Record<string, unknown>;
  source?: 'empty_search' | 'explicit_seek' | 'ai_chat' | 'filter_combo';
  userId?: string | null;
}

export async function persistDemandIntent(payload: DemandIntentPayload): Promise<void> {
  trackEvent('seek.intent_saved', {
    entityType: 'search',
    entityId: payload.queryText.slice(0, 200),
    payload: {
      categoria: payload.categoria,
      source: payload.source || 'explicit_seek',
    },
    userId: payload.userId ?? null,
  });

  try {
    await fetch('/api/demand-intents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        queryText: payload.queryText,
        categoria: payload.categoria,
        facets: payload.facets,
        ubicacion: payload.ubicacion,
        source: payload.source || 'explicit_seek',
        sessionId: getSessionId(),
        anonymousId: getAnonymousId(),
        userId: payload.userId,
      }),
    });
  } catch {
    // non-blocking
  }
}
