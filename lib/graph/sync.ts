import { supabaseAdmin } from '@/lib/supabase-admin';

export async function syncEventToGraph(event: {
  user_id: string | null;
  event_type: string;
  entity_type: string | null;
  entity_id: string | null;
  payload: Record<string, unknown>;
  score_delta: number;
}): Promise<void> {
  if (!event.user_id) return;

  const { data: userNodeId } = await supabaseAdmin.rpc('fn_upsert_graph_node', {
    p_node_type: 'User',
    p_ref_id: event.user_id,
    p_label: null,
    p_metadata: {},
  });

  if (!userNodeId) return;

  if (event.event_type === 'search.performed' && typeof event.payload.termino === 'string') {
    const { data: kwNodeId } = await supabaseAdmin.rpc('fn_upsert_graph_node', {
      p_node_type: 'Keyword',
      p_ref_id: event.payload.termino.toLowerCase().slice(0, 100),
      p_label: event.payload.termino,
      p_metadata: {},
    });
    if (kwNodeId) {
      await supabaseAdmin.from('graph_edges').insert({
        from_node_id: userNodeId,
        to_node_id: kwNodeId,
        edge_type: 'SEARCHED',
        weight: event.score_delta || 1,
      });
    }
  }

  if (event.entity_type === 'adiso' && event.entity_id) {
    const { data: adNodeId } = await supabaseAdmin.rpc('fn_upsert_graph_node', {
      p_node_type: 'Ad',
      p_ref_id: event.entity_id,
      p_label: null,
      p_metadata: { categoria: event.payload.categoria },
    });

    if (!adNodeId) return;

    let edgeType = 'INTERESTED_IN';
    if (event.event_type.includes('dismiss')) edgeType = 'DISMISSED';
    if (event.event_type.includes('contact')) edgeType = 'CONTACTED';

    await supabaseAdmin.from('graph_edges').insert({
      from_node_id: userNodeId,
      to_node_id: adNodeId,
      edge_type: edgeType,
      weight: Math.abs(event.score_delta || 1),
      metadata: event.payload,
    });
  }
}

export async function syncRecentEventsToGraph(limit = 200): Promise<number> {
  const { data: events } = await supabaseAdmin
    .from('behavioral_events')
    .select('user_id, event_type, entity_type, entity_id, payload, score_delta')
    .not('user_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(limit);

  let synced = 0;
  for (const ev of events || []) {
    await syncEventToGraph(ev as Parameters<typeof syncEventToGraph>[0]);
    synced += 1;
  }
  return synced;
}
