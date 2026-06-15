import { NextRequest, NextResponse } from 'next/server';
import { rebuildAllProfiles } from '@/lib/behavior/rebuild-profiles';

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV === 'development';
  const auth = request.headers.get('authorization');
  return auth === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const processed = await rebuildAllProfiles(100);
    return NextResponse.json({ ok: true, processed });
  } catch (e) {
    console.error('[cron/rebuild-profiles]', e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
export const maxDuration = 300;
