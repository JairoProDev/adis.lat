import { supabaseAdmin } from '@/lib/supabase-admin';
import { generateEmbedding } from '@/lib/ai/embeddings';

export type DemandIntentSource = 'empty_search' | 'explicit_seek' | 'ai_chat' | 'filter_combo';

export interface CreateDemandIntentInput {
  userId?: string | null;
  sessionId?: string | null;
  queryText: string;
  categoria?: string | null;
  facets?: Record<string, unknown>;
  ubicacion?: Record<string, unknown>;
  source: DemandIntentSource;
}

export async function upsertDemandIntent(input: CreateDemandIntentInput): Promise<string | null> {
  const queryText = input.queryText.trim();
  if (!queryText) return null;

  let embedding: number[] | null = null;
  try {
    embedding = await generateEmbedding(queryText);
  } catch {
    // embedding optional
  }

  const row = {
    user_id: input.userId || null,
    session_id: input.sessionId || null,
    query_text: queryText,
    categoria: input.categoria || null,
    facets: input.facets || {},
    ubicacion: input.ubicacion || {},
    embedding,
    source: input.source,
    status: 'active',
    updated_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
  };

  if (input.userId) {
    const { data: existing } = await supabaseAdmin
      .from('demand_intents')
      .select('id')
      .eq('user_id', input.userId)
      .eq('status', 'active')
      .eq('query_text', queryText)
      .maybeSingle();

    if (existing?.id) {
      await supabaseAdmin.from('demand_intents').update(row).eq('id', existing.id);
      return existing.id;
    }
  }

  const { data, error } = await supabaseAdmin
    .from('demand_intents')
    .insert(row)
    .select('id')
    .single();

  if (error) {
    console.error('[demand-intents] insert error:', error.message);
    return null;
  }
  return data.id as string;
}

export async function markDemandIntentConverted(intentId: string, adisoId: string): Promise<void> {
  await supabaseAdmin
    .from('demand_intents')
    .update({
      status: 'converted_to_ad',
      converted_adiso_id: adisoId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', intentId);
}
