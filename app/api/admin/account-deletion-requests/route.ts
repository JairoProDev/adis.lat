import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

function authorize(request: NextRequest): boolean {
  const secret = process.env.ADMIN_API_KEY;
  if (!secret) return true;
  return request.headers.get('x-admin-api-key') === secret;
}

export async function GET(request: NextRequest) {
  if (!authorize(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const status = request.nextUrl.searchParams.get('status');
    const limitParam = Number(request.nextUrl.searchParams.get('limit') || '100');
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 500) : 100;

    let query = supabaseAdmin
      .from('account_deletion_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status && ['pending', 'in_review', 'completed', 'rejected'].includes(status)) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[admin/account-deletion-requests] select error:', error.message);
      return NextResponse.json({ error: 'Could not load requests' }, { status: 500 });
    }

    return NextResponse.json({ requests: data ?? [] });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (message.includes('SUPABASE_SERVICE_ROLE_KEY')) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 503 });
    }
    console.error('[admin/account-deletion-requests] unexpected error:', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
