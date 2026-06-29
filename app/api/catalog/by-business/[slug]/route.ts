import { NextRequest, NextResponse } from 'next/server';
import { getCatalogProductsByBusinessSlug } from '@/lib/business';
import { normalizeBusinessSlug } from '@/lib/business/normalize-slug';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug: rawSlug } = await params;
    const slug = normalizeBusinessSlug(rawSlug);
    if (!slug) {
      return NextResponse.json({ products: [] }, { status: 400 });
    }

    const exclude = request.nextUrl.searchParams.get('exclude') || undefined;
    const limit = Number(request.nextUrl.searchParams.get('limit') || '8');

    const products = await getCatalogProductsByBusinessSlug(slug, {
      excludeId: exclude,
      limit: Math.min(limit, 20),
    });

    return NextResponse.json({ products });
  } catch (e) {
    console.error('[catalog/by-business]', e);
    return NextResponse.json({ products: [] }, { status: 500 });
  }
}
