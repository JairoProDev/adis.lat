import { NextRequest, NextResponse } from 'next/server';
import { getMercadoPagoPayment } from '@/lib/mercadopago';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    let paymentId =
      url.searchParams.get('data.id') ||
      url.searchParams.get('id');

    if (!paymentId) {
      const body = await req.json().catch(() => ({}));
      paymentId = body?.data?.id;
    }

    if (!paymentId) {
      return NextResponse.json({ ok: true });
    }

    const payment = await getMercadoPagoPayment(String(paymentId));
    if (!payment || payment.status !== 'approved' || !payment.externalReference) {
      return NextResponse.json({ ok: true });
    }

    if (!payment.externalReference.startsWith('bizsub_')) {
      return NextResponse.json({ ok: true });
    }

    const { data: subscription } = await supabaseAdmin
      .from('business_subscriptions')
      .select('id, business_profile_id, status')
      .eq('external_order_id', payment.externalReference)
      .maybeSingle();

    if (!subscription || subscription.status === 'active') {
      return NextResponse.json({ ok: true });
    }

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    await supabaseAdmin
      .from('business_subscriptions')
      .update({
        status: 'active',
        mercadopago_payment_id: String(paymentId),
        period_start: now.toISOString(),
        period_end: periodEnd.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('id', subscription.id);

    await supabaseAdmin
      .from('business_profiles')
      .update({
        subscription_tier: 'pro',
        updated_at: now.toISOString(),
      })
      .eq('id', subscription.business_profile_id);

    await supabaseAdmin
      .from('qr_codes')
      .update({ style_tier: 'pro', updated_at: now.toISOString() })
      .eq('business_profile_id', subscription.business_profile_id);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[subscription/webhook]', e);
    return NextResponse.json({ error: 'webhook error' }, { status: 500 });
  }
}
