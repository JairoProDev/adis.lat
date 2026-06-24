import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { claimOrphanBusinessBySlug } from '@/lib/business/claim-orphan';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  slug: z.string().min(1).max(120),
});

export async function POST(request: NextRequest) {
  const raw = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'slug_invalid' }, { status: 400 });
  }

  const result = await claimOrphanBusinessBySlug(parsed.data.slug);

  if (!result.ok) {
    const status =
      result.error === 'not_authenticated'
        ? 401
        : result.error === 'not_found'
          ? 404
          : result.error === 'already_owned' || result.error === 'reserved_for_other_email'
            ? 403
            : 400;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json(result);
}
