import { NextRequest, NextResponse } from 'next/server';
import { searchGeoLocations } from '@/lib/geo/subdivisions-server';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get('q') || '';
  const country = searchParams.get('country') || undefined;
  const limit = Math.min(Number(searchParams.get('limit') || 20), 40);

  if (q.trim().length < 2) {
    return NextResponse.json({ results: [] });
  }

  const results = searchGeoLocations(q, country, limit);
  return NextResponse.json({ results });
}
