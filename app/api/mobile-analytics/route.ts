import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

const MAX_EVENT_NAME_LEN = 128;
const MAX_PAYLOAD_BYTES = 16_384;

function getClientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || null;
  }
  return request.headers.get('x-real-ip');
}

function checkIngestSecret(request: NextRequest): boolean {
  const secret = process.env.MOBILE_INGEST_SECRET;
  if (!secret) {
    return true;
  }
  return request.headers.get('x-mobile-ingest-secret') === secret;
}

export async function POST(request: NextRequest) {
  if (!checkIngestSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const raw = await request.text();
    if (raw.length > MAX_PAYLOAD_BYTES * 2) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
    }

    let body: Record<string, unknown>;
    try {
      body = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const eventName = typeof body.eventName === 'string' ? body.eventName.trim() : '';
    if (!eventName || eventName.length > MAX_EVENT_NAME_LEN) {
      return NextResponse.json({ error: 'Invalid eventName' }, { status: 400 });
    }

    const payload =
      body.payload !== undefined && body.payload !== null && typeof body.payload === 'object'
        ? (body.payload as Record<string, unknown>)
        : {};

    const clientTimestamp =
      typeof body.timestamp === 'string' ? body.timestamp : null;
    const sessionDurationMs =
      typeof body.sessionDurationMs === 'number' && Number.isFinite(body.sessionDurationMs)
        ? Math.min(Math.floor(body.sessionDurationMs), 86_400_000)
        : null;

    const row = {
      event_name: eventName,
      payload,
      client_timestamp: clientTimestamp,
      session_duration_ms: sessionDurationMs,
      app_version: typeof body.appVersion === 'string' ? body.appVersion.slice(0, 64) : null,
      app_build: typeof body.appBuild === 'string' ? body.appBuild.slice(0, 64) : null,
      platform: typeof body.platform === 'string' ? body.platform.slice(0, 32) : null,
      device_brand: typeof body.brand === 'string' ? body.brand.slice(0, 64) : null,
      device_model: typeof body.modelName === 'string' ? body.modelName.slice(0, 128) : null,
      os_version: typeof body.osVersion === 'string' ? body.osVersion.slice(0, 64) : null,
      is_connected: typeof body.isConnected === 'boolean' ? body.isConnected : null,
      user_agent: request.headers.get('user-agent')?.slice(0, 512) ?? null,
      client_ip: getClientIp(request),
    };

    const { error } = await supabaseAdmin.from('mobile_analytics_events').insert(row);

    if (error) {
      console.error('[mobile-analytics] insert error:', error.message);
      return NextResponse.json({ error: 'Storage failed' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (message.includes('SUPABASE_SERVICE_ROLE_KEY')) {
      return NextResponse.json(
        { error: 'Server not configured for mobile ingest' },
        { status: 503 }
      );
    }
    console.error('[mobile-analytics]', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
