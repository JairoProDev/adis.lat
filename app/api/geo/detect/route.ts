import { NextRequest, NextResponse } from 'next/server';
import {
  detectFromIP,
  detectFromCoords,
  defaultDetect,
} from '@/lib/geo/detect-server';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  try {
    if (lat && lng) {
      const result = await detectFromCoords(Number(lat), Number(lng));
      return NextResponse.json(result);
    }
    const result = await detectFromIP();
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(defaultDetect());
  }
}
