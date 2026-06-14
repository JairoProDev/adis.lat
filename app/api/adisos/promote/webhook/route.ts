import { NextRequest, NextResponse } from 'next/server';
import { getMercadoPagoPayment } from '@/lib/mercadopago';
import {
  fulfillPromotionOrder,
  getPromotionOrder,
  markPromotionOrderPaid,
} from '@/lib/promotions/server';

/**
 * Webhook IPN de Mercado Pago.
 * MP envía ?topic=payment&id=12345 o body con data.id
 */
export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    let paymentId = url.searchParams.get('id') || url.searchParams.get('data.id');

    if (!paymentId) {
      try {
        const body = (await request.json()) as { data?: { id?: string }; id?: string };
        paymentId = body?.data?.id || body?.id || null;
      } catch {
        // body vacío o no JSON
      }
    }

    if (!paymentId) {
      return NextResponse.json({ ok: true, skipped: 'no_payment_id' });
    }

    const payment = await getMercadoPagoPayment(paymentId);
    if (!payment?.externalReference) {
      return NextResponse.json({ ok: true, skipped: 'payment_not_found' });
    }

    const orderId = payment.externalReference;
    const order = await getPromotionOrder(orderId);
    if (!order) {
      return NextResponse.json({ ok: true, skipped: 'order_not_found' });
    }

    if (order.fulfilled_at) {
      return NextResponse.json({ ok: true, already_fulfilled: true });
    }

    const approved = payment.status === 'approved';

    if (!approved) {
      return NextResponse.json({ ok: true, status: payment.status });
    }

    const marked = await markPromotionOrderPaid(orderId, paymentId);
    if (!marked) {
      return NextResponse.json({ ok: true, status: 'already_paid' });
    }

    await fulfillPromotionOrder(orderId);

    return NextResponse.json({ ok: true, fulfilled: true });
  } catch (e) {
    console.error('[api/adisos/promote/webhook]', e);
    return NextResponse.json({ error: 'webhook_error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // MP también puede notificar vía GET
  return POST(request);
}
