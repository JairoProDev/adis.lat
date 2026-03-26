import { Categoria } from '@/types';

export interface PublishDraft {
  id: string;
  sessionId: string;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'ready' | 'published';
  data: {
    categoria: Categoria;
    titulo: string;
    descripcion: string;
    precio?: number;
    ubicacion?: string;
    contacto?: string;
    imageUrl?: string;
  };
}

const drafts = new Map<string, PublishDraft>();

export function createOrUpdateDraft(input: {
  sessionId: string;
  draftId?: string;
  data: PublishDraft['data'];
}): PublishDraft {
  const now = new Date().toISOString();
  const id = input.draftId || `draft_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const existing = drafts.get(id);
  const draft: PublishDraft = {
    id,
    sessionId: input.sessionId,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    status: existing?.status || 'draft',
    data: { ...(existing?.data || {}), ...input.data },
  };
  drafts.set(id, draft);
  return draft;
}

export function getDraft(id: string): PublishDraft | null {
  return drafts.get(id) || null;
}

export function listDraftsBySession(sessionId: string): PublishDraft[] {
  return Array.from(drafts.values()).filter((d) => d.sessionId === sessionId);
}

export function markDraftPublished(id: string): PublishDraft | null {
  const d = drafts.get(id);
  if (!d) return null;
  d.status = 'published';
  d.updatedAt = new Date().toISOString();
  drafts.set(id, d);
  return d;
}
