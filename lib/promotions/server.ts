import { supabaseAdmin } from '@/lib/supabase-admin';
import { AdisoPromotionTier } from '@/types';
import { calculatePromotionTotalPen } from '@/lib/promotions';

export type PromotionOrderStatus = 'pending' | 'paid' | 'dev_bypass' | 'failed' | 'cancelled';

export interface PromotionOrderRow {
  id: string;
  user_id: string;
  adiso_id: string;
  tier: AdisoPromotionTier;
  days: number;
  amount_pen: number;
  status: PromotionOrderStatus;
  mp_preference_id: string | null;
  mp_payment_id: string | null;
  paid_at: string | null;
  fulfilled_at: string | null;
}

export async function verifyAdisoOwnership(adisoId: string, userId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('adisos')
    .select('id')
    .eq('id', adisoId)
    .eq('user_id', userId)
    .maybeSingle();

  return !error && Boolean(data);
}

export async function createPromotionOrder(params: {
  userId: string;
  adisoId: string;
  tier: AdisoPromotionTier;
  days: number;
  status?: PromotionOrderStatus;
  mpPreferenceId?: string;
}): Promise<PromotionOrderRow | null> {
  const amount = calculatePromotionTotalPen(params.tier, params.days);
  const isPrepaid = params.status === 'paid' || params.status === 'dev_bypass' || amount === 0;

  const { data, error } = await supabaseAdmin
    .from('adiso_promotion_orders')
    .insert({
      user_id: params.userId,
      adiso_id: params.adisoId,
      tier: params.tier,
      days: params.days,
      amount_pen: amount,
      status: params.status || (amount > 0 ? 'pending' : 'paid'),
      mp_preference_id: params.mpPreferenceId || null,
      paid_at: isPrepaid ? new Date().toISOString() : null,
    })
    .select('*')
    .single();

  if (error || !data) {
    console.error('[promotion] create order error:', error?.message);
    return null;
  }

  return data as PromotionOrderRow;
}

export async function getPromotionOrder(orderId: string): Promise<PromotionOrderRow | null> {
  const { data, error } = await supabaseAdmin
    .from('adiso_promotion_orders')
    .select('*')
    .eq('id', orderId)
    .maybeSingle();

  if (error || !data) return null;
  return data as PromotionOrderRow;
}

export async function markPromotionOrderPaid(
  orderId: string,
  mpPaymentId?: string
): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from('adiso_promotion_orders')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      mp_payment_id: mpPaymentId || null,
    })
    .eq('id', orderId)
    .in('status', ['pending']);

  return !error;
}

export async function fulfillPromotionOrder(orderId: string): Promise<void> {
  const { error } = await supabaseAdmin.rpc('fn_fulfill_promotion_order', {
    p_order_id: orderId,
  });

  if (error) {
    console.error('[promotion] fulfill error:', error.message);
    throw new Error(error.message);
  }
}

/** Quita promoción (tier gratis) de forma inmediata vía orden de monto cero. */
export async function removeAdisoPromotion(userId: string, adisoId: string): Promise<void> {
  const order = await createPromotionOrder({
    userId,
    adisoId,
    tier: 'gratis',
    days: 0,
    status: 'paid',
  });

  if (!order) throw new Error('No se pudo crear la orden');

  await fulfillPromotionOrder(order.id);
}

export function isPromotionDevBypassEnabled(): boolean {
  return (
    process.env.NODE_ENV === 'development' &&
    process.env.PROMOTION_DEV_BYPASS === 'true'
  );
}
