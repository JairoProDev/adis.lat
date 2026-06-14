import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { getPromotionOrder } from '@/lib/promotions/server';
import { promotionExpiresAtIso } from '@/lib/promotions';

export async function GET(request: NextRequest) {
  const user = await getUserFromRouteRequest(request);
  if (!user?.id) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const orderId = request.nextUrl.searchParams.get('orderId');
  if (!orderId) {
    return NextResponse.json({ error: 'orderId requerido' }, { status: 400 });
  }

  const order = await getPromotionOrder(orderId);
  if (!order || order.user_id !== user.id) {
    return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
  }

  return NextResponse.json({
    orderId: order.id,
    status: order.status,
    tier: order.tier,
    days: order.days,
    amountPen: order.amount_pen,
    fulfilled: Boolean(order.fulfilled_at),
    expiresAt:
      order.fulfilled_at && order.tier !== 'gratis'
        ? promotionExpiresAtIso(order.tier, order.days)
        : null,
  });
}
