import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';

export async function POST(req: NextRequest) {
  const user = await getUserFromRouteRequest(req);
  if (!user) {
    return NextResponse.json({ ok: false, skipped: true });
  }

  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : null;
  if (!token) {
    return NextResponse.json({ ok: false, skipped: true });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  const { data, error } = await supabase.rpc('claim_pending_business_ownership');
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ...(data || {}), ok: Boolean((data as { ok?: boolean })?.ok) });
}
