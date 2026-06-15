import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { rateLimit, getClientIP } from '@/lib/rate-limit';
import { upsertDemandIntent } from '@/lib/demand-intents/server';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';

const bodySchema = z.object({
  queryText: z.string().min(1).max(500),
  categoria: z.string().max(64).optional(),
  facets: z.record(z.unknown()).optional(),
  ubicacion: z.record(z.unknown()).optional(),
  source: z.enum(['empty_search', 'explicit_seek', 'ai_chat', 'filter_combo']).optional(),
  sessionId: z.string().max(128).optional(),
  anonymousId: z.string().max(128).optional(),
  userId: z.string().uuid().optional().nullable(),
});

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);
  const limited = rateLimit(`demand-intents-${ip}`, { windowMs: 60_000, maxRequests: 30 });
  if (!limited.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  try {
    const json = (await request.json()) as unknown;
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const authUser = await getUserFromRouteRequest(request);
    const userId = authUser?.id || parsed.data.userId || null;

    const id = await upsertDemandIntent({
      userId,
      sessionId: parsed.data.sessionId,
      queryText: parsed.data.queryText,
      categoria: parsed.data.categoria,
      facets: parsed.data.facets,
      ubicacion: parsed.data.ubicacion,
      source: parsed.data.source || 'explicit_seek',
    });

    return NextResponse.json({ ok: true, id });
  } catch (e) {
    console.error('[demand-intents]', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
