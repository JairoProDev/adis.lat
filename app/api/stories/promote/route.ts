import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { verifyStoryOwnership } from '@/lib/stories/server';
import {
  createStoryPromotionOrder,
  fulfillStoryPromotionOrder,
  isStoryPromotionDevBypassEnabled,
} from '@/lib/stories/promotions';
import { createMercadoPagoPreference, isMercadoPagoConfigured } from '@/lib/mercadopago';
import { storyTierPrice } from '@/lib/stories/config';
import { STORY_TIERS } from '@/types';
import { supabaseAdmin } from '@/lib/supabase-admin';

const bodySchema = z.object({
  storyId: z.string().uuid(),
  tier: z.enum(['destacada', 'premium']),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRouteRequest(request);
    if (!user?.id) {
      return NextResponse.json({ error: 'Debes iniciar sesión' }, { status: 401 });
    }

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const { storyId, tier } = parsed.data;
    const owns = await verifyStoryOwnership(storyId, user.id);
    if (!owns) {
      return NextResponse.json({ error: 'No eres el dueño de esta historia' }, { status: 403 });
    }

    const amount = storyTierPrice(tier);
    const tierInfo = STORY_TIERS[tier];

    if (isStoryPromotionDevBypassEnabled()) {
      const order = await createStoryPromotionOrder({
        userId: user.id,
        storyId,
        tier,
        status: 'dev_bypass',
      });
      if (!order) {
        return NextResponse.json({ error: 'No se pudo registrar la orden' }, { status: 500 });
      }
      await fulfillStoryPromotionOrder(order.id);
      return NextResponse.json({ status: 'fulfilled', tier, devBypass: true });
    }

    const order = await createStoryPromotionOrder({
      userId: user.id,
      storyId,
      tier,
      status: 'pending',
    });

    if (!order) {
      return NextResponse.json({ error: 'No se pudo crear la orden' }, { status: 500 });
    }

    if (!isMercadoPagoConfigured()) {
      await supabaseAdmin
        .from('story_promotion_orders')
        .update({ status: 'cancelled' })
        .eq('id', order.id);
      return NextResponse.json(
        {
          error: 'Pagos en línea no disponibles aún.',
          code: 'PAYMENTS_NOT_CONFIGURED',
        },
        { status: 503 }
      );
    }

    const preference = await createMercadoPagoPreference({
      orderId: order.id,
      title: `Buscadis · Historia ${tierInfo.nombre}`,
      unitPricePen: amount,
      payerEmail: user.email || undefined,
      kind: 'story',
    });

    if (!preference) {
      await supabaseAdmin
        .from('story_promotion_orders')
        .update({ status: 'failed' })
        .eq('id', order.id);
      return NextResponse.json({ error: 'No se pudo iniciar el pago' }, { status: 502 });
    }

    await supabaseAdmin
      .from('story_promotion_orders')
      .update({ mp_preference_id: preference.preferenceId })
      .eq('id', order.id);

    const useSandbox =
      process.env.NODE_ENV === 'development' &&
      process.env.MERCADOPAGO_USE_SANDBOX === 'true';

    return NextResponse.json({
      status: 'checkout',
      orderId: order.id,
      checkoutUrl:
        useSandbox && preference.sandboxInitPoint
          ? preference.sandboxInitPoint
          : preference.initPoint,
      amountPen: amount,
      tier,
    });
  } catch (e) {
    console.error('[api/stories/promote]', e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
