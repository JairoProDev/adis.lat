import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { matchAdsForUser } from '@/lib/matching/server';

export async function GET(request: NextRequest) {
  const user = await getUserFromRouteRequest(request);
  if (!user?.id) {
    return NextResponse.json({ adisoIds: [] });
  }

  const matches = await matchAdsForUser(user.id, 12);
  return NextResponse.json({ adisoIds: matches.map((m) => m.adisoId) });
}
