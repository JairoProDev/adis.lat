import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';

export async function GET(request: NextRequest) {
  const user = await getUserFromRouteRequest(request);
  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('rol')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.rol !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const [
    { count: eventsCount },
    { count: profilesCount },
    { count: intentsCount },
    { count: campaignsCount },
    { data: demandByCategory },
  ] = await Promise.all([
    supabaseAdmin.from('behavioral_events').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('user_behavior_profiles').select('user_id', { count: 'exact', head: true }),
    supabaseAdmin.from('demand_intents').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabaseAdmin.from('notification_campaigns').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('demand_intents').select('categoria').eq('status', 'active'),
  ]);

  const categoryHeatmap: Record<string, number> = {};
  for (const row of demandByCategory || []) {
    const cat = (row as { categoria?: string }).categoria || 'sin_categoria';
    categoryHeatmap[cat] = (categoryHeatmap[cat] || 0) + 1;
  }

  const { data: recentInferences } = await supabaseAdmin
    .from('inference_log')
    .select('inference_type, confidence, created_at')
    .order('created_at', { ascending: false })
    .limit(20);

  return NextResponse.json({
    totals: {
      behavioralEvents: eventsCount || 0,
      behaviorProfiles: profilesCount || 0,
      activeDemandIntents: intentsCount || 0,
      campaigns: campaignsCount || 0,
    },
    demandByCategory: categoryHeatmap,
    recentInferences: recentInferences || [],
  });
}
