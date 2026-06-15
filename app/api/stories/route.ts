import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import {
  createStoryServer,
  uploadStoryMediaServer,
  verifyStoryOwnership,
} from '@/lib/stories/server';
import {
  createStoryPromotionOrder,
  fulfillStoryPromotionOrder,
  isStoryPromotionDevBypassEnabled,
} from '@/lib/stories/promotions';
import { createMercadoPagoPreference, isMercadoPagoConfigured } from '@/lib/mercadopago';
import { isPaidStoryTier, storyTierPrice } from '@/lib/stories/config';
import { StoryObjective, StoryPromotionTier, STORY_TIERS } from '@/types';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

const tierSchema = z.enum(['gratis', 'destacada', 'premium']);
const objectiveSchema = z.enum(['ventas', 'clicks', 'contactos']);

const MAX_BYTES = 25 * 1024 * 1024;

export async function GET(request: NextRequest) {
  try {
    const { getActiveStoriesServer } = await import('@/lib/stories/server');
    const categoria = request.nextUrl.searchParams.get('categoria') || undefined;
    const stories = await getActiveStoriesServer({ categoria });
    return NextResponse.json({ stories });
  } catch (e) {
    console.error('[api/stories GET]', e);
    return NextResponse.json({ error: 'Error al cargar historias' }, { status: 500 });
  }
}

async function startStoryCheckout(params: {
  userId: string;
  userEmail?: string;
  storyId: string;
  tier: StoryPromotionTier;
}) {
  const amount = storyTierPrice(params.tier);
  const tierInfo = STORY_TIERS[params.tier];

  if (isStoryPromotionDevBypassEnabled()) {
    const order = await createStoryPromotionOrder({
      userId: params.userId,
      storyId: params.storyId,
      tier: params.tier,
      status: 'dev_bypass',
    });
    if (!order) throw new Error('No se pudo registrar la orden');
    await fulfillStoryPromotionOrder(order.id);
    return { status: 'fulfilled' as const, devBypass: true };
  }

  const order = await createStoryPromotionOrder({
    userId: params.userId,
    storyId: params.storyId,
    tier: params.tier,
    status: 'pending',
  });

  if (!order) throw new Error('No se pudo crear la orden');

  if (!isMercadoPagoConfigured()) {
    await supabaseAdmin
      .from('story_promotion_orders')
      .update({ status: 'cancelled' })
      .eq('id', order.id);
    return {
      status: 'unavailable' as const,
      code: 'PAYMENTS_NOT_CONFIGURED',
      error: 'Pagos en línea no disponibles aún.',
    };
  }

  const preference = await createMercadoPagoPreference({
    orderId: order.id,
    title: `Buscadis · Historia ${tierInfo.nombre}`,
    unitPricePen: amount,
    payerEmail: params.userEmail,
    kind: 'story',
  });

  if (!preference) {
    await supabaseAdmin
      .from('story_promotion_orders')
      .update({ status: 'failed' })
      .eq('id', order.id);
    throw new Error('No se pudo iniciar el pago');
  }

  await supabaseAdmin
    .from('story_promotion_orders')
    .update({ mp_preference_id: preference.preferenceId })
    .eq('id', order.id);

  const useSandbox =
    process.env.NODE_ENV === 'development' &&
    process.env.MERCADOPAGO_USE_SANDBOX === 'true';

  return {
    status: 'checkout' as const,
    orderId: order.id,
    checkoutUrl:
      useSandbox && preference.sandboxInitPoint
        ? preference.sandboxInitPoint
        : preference.initPoint,
    amountPen: amount,
  };
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRouteRequest(request);
    if (!user?.id) {
      return NextResponse.json({ error: 'Debes iniciar sesión' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: 'Selecciona una imagen o video' }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'El archivo supera 25 MB' }, { status: 400 });
    }

    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      return NextResponse.json({ error: 'Formato no soportado' }, { status: 400 });
    }

    const caption = String(formData.get('caption') || '').trim().slice(0, 150);
    const categoria = String(formData.get('categoria') || '').trim() || undefined;
    const adisoId = String(formData.get('adisoId') || '').trim() || undefined;
    const objectiveRaw = String(formData.get('objective') || 'contactos');
    const objectiveParsed = objectiveSchema.safeParse(objectiveRaw);
    const objective: StoryObjective = objectiveParsed.success
      ? objectiveParsed.data
      : 'contactos';

    const tierRaw = String(formData.get('tier') || 'gratis');
    const tierParsed = tierSchema.safeParse(tierRaw);
    if (!tierParsed.success) {
      return NextResponse.json({ error: 'Tier de promoción inválido' }, { status: 400 });
    }
    const tier: StoryPromotionTier = tierParsed.data;

    const uploaded = await uploadStoryMediaServer(file, user.id);
    const story = await createStoryServer(user.id, {
      mediaUrl: uploaded.url,
      mediaType: uploaded.mediaType,
      caption: caption || undefined,
      categoria,
      adisoId,
      promotionTier: tier,
      objective,
      status: isPaidStoryTier(tier) ? 'draft' : 'active',
    });

    if (!isPaidStoryTier(tier)) {
      return NextResponse.json({ success: true, story, status: 'fulfilled' });
    }

    const owns = await verifyStoryOwnership(story.id, user.id);
    if (!owns) {
      return NextResponse.json({ error: 'Historia no encontrada' }, { status: 404 });
    }

    const checkout = await startStoryCheckout({
      userId: user.id,
      userEmail: user.email || undefined,
      storyId: story.id,
      tier,
    });

    if (checkout.status === 'unavailable') {
      return NextResponse.json(
        { error: checkout.error, code: checkout.code, story },
        { status: 503 }
      );
    }

    return NextResponse.json({ success: true, story, ...checkout });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error al publicar';
    console.error('[api/stories POST]', e);

    if (message.includes('SUPABASE_SERVICE_ROLE_KEY')) {
      return NextResponse.json(
        { error: 'Servidor no configurado para publicar historias' },
        { status: 503 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
