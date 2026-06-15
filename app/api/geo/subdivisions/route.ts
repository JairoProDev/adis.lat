import { NextRequest, NextResponse } from 'next/server';
import {
  getLevel1Options,
  getLevel2Options,
  getLevel3Options,
  getAdminDepth,
} from '@/lib/geo/subdivisions-server';
import { getCountryLevelLabels } from '@/lib/geo/countries-data';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const country = searchParams.get('country') || 'PE';
  const level1 = searchParams.get('level1') || undefined;
  const level2 = searchParams.get('level2') || undefined;

  const labels = getCountryLevelLabels(country);
  const depth = getAdminDepth(country);

  if (!level1) {
    return NextResponse.json({
      options: getLevel1Options(country),
      level: 1,
      label: labels.level1,
      depth,
    });
  }

  if (!level2) {
    return NextResponse.json({
      options: getLevel2Options(country, level1),
      level: 2,
      label: labels.level2,
      depth,
    });
  }

  return NextResponse.json({
    options: getLevel3Options(country, level1, level2),
    level: 3,
    label: labels.level3 || 'Distrito',
    depth,
  });
}
