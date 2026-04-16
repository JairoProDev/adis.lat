import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase-admin';

const bodySchema = z.object({
  email: z.string().trim().email().max(254),
  fullName: z.string().trim().max(120).optional().default(''),
  requestType: z.enum(['account_and_data', 'data_only']),
  details: z.string().trim().max(2000).optional().default(''),
});

function getClientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() || null;
  return request.headers.get('x-real-ip');
}

export async function POST(request: NextRequest) {
  try {
    const json = (await request.json()) as unknown;
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request payload', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { email, fullName, requestType, details } = parsed.data;

    const { error } = await supabaseAdmin.from('account_deletion_requests').insert({
      email: email.toLowerCase(),
      request_type: requestType,
      full_name: fullName || null,
      details: details || null,
      requester_ip: getClientIp(request),
      user_agent: request.headers.get('user-agent')?.slice(0, 512) ?? null,
      source: 'public_account_deletion_page',
    });

    if (error) {
      console.error('[account-deletion-request] insert error:', error.message);
      return NextResponse.json({ error: 'Could not store request' }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      message:
        'Request received. Our team will contact you at the provided email to verify and process deletion.',
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (message.includes('SUPABASE_SERVICE_ROLE_KEY')) {
      return NextResponse.json(
        { error: 'Server not configured for deletion requests' },
        { status: 503 }
      );
    }
    console.error('[account-deletion-request] unexpected error:', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
