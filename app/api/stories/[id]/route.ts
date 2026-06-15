import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import {
  deleteStoryServer,
  getStoryMetricsServer,
  reactivateStoryServer,
  verifyStoryOwnership,
} from '@/lib/stories/server';
import {
  createStoryPromotionOrder,
  fulfillStoryPromotionOrder,
  isStoryPromotionDevBypassEnabled,
} from '@/lib/stories/promotions';
import { createMercadoPagoPreference, isMercadoPagoConfigured } from '@/lib/mercadopago';
import { isPaidStoryTier, storyTierPrice } from '@/lib/stories/config';
import { StoryPromotionTier, STORY_TIERS } from '@/types';
import { supabaseAdmin } from '@/lib/supabase-admin';

const reactivateSchema = z.object({
  tier: z.enum(['gratis', 'destacada', 'premium']),
});

type RouteParams = { params: Promise<{ id: string }> };

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getUserFromRouteRequest(request);
    if (!user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    await deleteStoryServer(user.id, id);
    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error al eliminar';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getUserFromRouteRequest(request);
    if (!user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const owns = await verifyStoryOwnership(id, user.id);
    if (!owns) {
      return NextResponse.json({ error: 'Historia no encontrada' }, { status: 404 });
    }

    const metrics = await getStoryMetricsServer(id);
    return NextResponse.json({ metrics });
  } catch (e) {
    console.error('[api/stories/[id] GET metrics]', e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getUserFromRouteRequest(request);
    if (!user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const owns = await verifyStoryOwnership(id, user.id);
    if (!owns) {
      return NextResponse.json({ error: 'Historia no encontrada' }, { status: 404 });
    }

    const parsed = reactivateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Tier inválido' }, { status: 400 });
    }

    const tier: StoryPromotionTier = parsed.data.tier;

    if (!isPaidStoryTier(tier)) {
      const story = await reactivateStoryServer(user.id, id, tier);
      await supabaseAdmin.from('story_reactivations').insert({
        story_id: id,
        user_id: user.id,
        tier,
      });
      return NextResponse.json({ status: 'fulfilled', story });
    }

    if (isStoryPromotionDevBypassEnabled()) {
      const order = await createStoryPromotionOrder({
        userId: user.id,
        storyId: id,
        tier,
        status: 'dev_bypass',
      });
      if (!order) {
        return NextResponse.json({ error: 'No se pudo registrar la orden' }, { status: 500 });
      }
      await fulfillStoryPromotionOrder(order.id);
      const { data: story } = await supabaseAdmin
        .from('stories')
        .select('*')
        .eq('id', id)
        .single();
      return NextResponse.json({ status: 'fulfilled', story, devBypass: true });
    }

    const order = await createStoryPromotionOrder({
      userId: user.id,
      storyId: id,
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
        { error: 'Pagos no disponibles', code: 'PAYMENTS_NOT_CONFIGURED' },
        { status: 503 }
      );
    }

    const tierInfo = STORY_TIERS[tier];
    const preference = await createMercadoPagoPreference({
      orderId: order.id,
      title: `Buscadis · Republicar ${tierInfo.nombre}`,
      unitPricePen: storyTierPrice(tier),
      payerEmail: user.email || undefined,
      kind: 'story',
    });

    if (!preference) {
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
      tier,
    });
  } catch (e) {
    console.error('[api/stories/[id] reactivate]', e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
