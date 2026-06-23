import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { getBusinessProfileBySlug } from '@/lib/business';
import { getBusinessMemberRole } from '@/lib/business-access';
import { supabaseAdmin } from '@/lib/supabase-admin';
import {
  createMercadoPagoPreference,
  isMercadoPagoConfigured,
} from '@/lib/mercadopago';
import { PRO_QR_MONTHLY_PRICE_PEN, canUseProQr } from '@/lib/business/subscription';

export async function POST(req: NextRequest) {
  const user = await getUserFromRouteRequest(req);
  if (!user?.id) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  if (!isMercadoPagoConfigured()) {
    return NextResponse.json(
      { error: 'Pagos no configurados. Contacta soporte.' },
      { status: 503 }
    );
  }

  const body = (await req.json()) as { slug?: string };
  if (!body.slug) {
    return NextResponse.json({ error: 'slug requerido' }, { status: 400 });
  }

  const profile = await getBusinessProfileBySlug(body.slug);
  if (!profile) {
    return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 });
  }

  const role = await getBusinessMemberRole(user.id, profile.id);
  if (profile.user_id !== user.id && (!role || !['owner', 'admin'].includes(role))) {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });
  }

  if (canUseProQr(profile)) {
    return NextResponse.json({ error: 'Ya tienes plan Pro activo' }, { status: 400 });
  }

  const orderId = `bizsub_${nanoid(12)}`;
  const { data: subRow, error: subErr } = await supabaseAdmin
    .from('business_subscriptions')
    .insert({
      business_profile_id: profile.id,
      tier: 'pro',
      status: 'pending',
      amount_pen: PRO_QR_MONTHLY_PRICE_PEN,
      external_order_id: orderId,
    })
    .select('id')
    .single();

  if (subErr || !subRow) {
    console.error('[subscription]', subErr);
    return NextResponse.json({ error: 'Error al crear suscripción' }, { status: 500 });
  }

  const preference = await createMercadoPagoPreference({
    orderId,
    title: `Buscadis Pro — ${profile.name}`,
    unitPricePen: PRO_QR_MONTHLY_PRICE_PEN,
    payerEmail: user.email,
    kind: 'business_subscription',
  });

  if (!preference) {
    return NextResponse.json({ error: 'Error al crear preferencia de pago' }, { status: 502 });
  }

  await supabaseAdmin
    .from('business_subscriptions')
    .update({
      mercadopago_preference_id: preference.preferenceId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', subRow.id);

  return NextResponse.json({
    initPoint: preference.initPoint,
    sandboxInitPoint: preference.sandboxInitPoint,
    orderId,
  });
}
