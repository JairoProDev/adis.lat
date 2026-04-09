import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

const MAX_BATCH = 100;
const DEFAULT_BROADCAST_CAP = 500;

type ExpoPushMessage = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
  channelId?: string;
};

function authorize(request: NextRequest): boolean {
  const secret = process.env.MOBILE_PUSH_ADMIN_SECRET;
  if (!secret) {
    return false;
  }
  const auth = request.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) {
    return false;
  }
  return auth.slice(7) === secret;
}

export async function POST(request: NextRequest) {
  if (!authorize(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      title?: string;
      body?: string;
      data?: Record<string, unknown>;
      tokens?: string[];
      broadcast?: boolean;
      broadcastLimit?: number;
    };

    const title = typeof body.title === 'string' ? body.title.trim().slice(0, 200) : '';
    const text = typeof body.body === 'string' ? body.body.trim().slice(0, 2000) : '';
    if (!title || !text) {
      return NextResponse.json({ error: 'title and body required' }, { status: 400 });
    }

    let targets: string[] = [];
    if (Array.isArray(body.tokens) && body.tokens.length > 0) {
      targets = body.tokens.filter((t) => typeof t === 'string').slice(0, MAX_BATCH);
    } else if (body.broadcast === true) {
      const cap = Math.min(
        Math.max(1, Number(body.broadcastLimit) || DEFAULT_BROADCAST_CAP),
        2000
      );
      const { data, error } = await supabaseAdmin
        .from('expo_push_tokens')
        .select('expo_push_token')
        .order('last_seen_at', { ascending: false })
        .limit(cap);

      if (error) {
        console.error('[mobile-push/send] select error:', error.message);
        return NextResponse.json({ error: 'Failed to load tokens' }, { status: 500 });
      }
      targets = (data ?? []).map((r) => r.expo_push_token as string);
    }

    if (targets.length === 0) {
      return NextResponse.json({ error: 'No tokens to send to' }, { status: 400 });
    }

    const messages: ExpoPushMessage[] = targets.map((to) => ({
      to,
      title,
      body: text,
      data: body.data && typeof body.data === 'object' ? body.data : undefined,
      sound: 'default',
      channelId: 'general',
    }));

    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };
    if (process.env.EXPO_ACCESS_TOKEN) {
      headers.Authorization = `Bearer ${process.env.EXPO_ACCESS_TOKEN}`;
    }

    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers,
      body: JSON.stringify(messages),
    });

    const result = (await res.json()) as { data?: unknown; errors?: unknown };

    if (!res.ok) {
      console.error('[mobile-push/send] Expo API error:', res.status, result);
      return NextResponse.json(
        { error: 'Expo push API error', status: res.status, details: result },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, sent: targets.length, result });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (message.includes('SUPABASE_SERVICE_ROLE_KEY')) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 503 });
    }
    console.error('[mobile-push/send]', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
