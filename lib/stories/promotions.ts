import { supabaseAdmin } from '@/lib/supabase-admin';
import { StoryPromotionTier } from '@/types';
import { storyTierPrice } from '@/lib/stories/config';

export type StoryOrderStatus = 'pending' | 'paid' | 'dev_bypass' | 'failed' | 'cancelled';

export interface StoryPromotionOrderRow {
  id: string;
  user_id: string;
  story_id: string;
  tier: StoryPromotionTier;
  amount_pen: number;
  status: StoryOrderStatus;
  mp_preference_id: string | null;
  mp_payment_id: string | null;
  paid_at: string | null;
  fulfilled_at: string | null;
}

export function isStoryPromotionDevBypassEnabled(): boolean {
  return process.env.PROMOTION_DEV_BYPASS === 'true';
}

export async function createStoryPromotionOrder(params: {
  userId: string;
  storyId: string;
  tier: StoryPromotionTier;
  status?: StoryOrderStatus;
  mpPreferenceId?: string;
}): Promise<StoryPromotionOrderRow | null> {
  const amount = storyTierPrice(params.tier);
  const isPrepaid = params.status === 'paid' || params.status === 'dev_bypass' || amount === 0;

  const { data, error } = await supabaseAdmin
    .from('story_promotion_orders')
    .insert({
      user_id: params.userId,
      story_id: params.storyId,
      tier: params.tier,
      amount_pen: amount,
      status: params.status || (amount > 0 ? 'pending' : 'paid'),
      mp_preference_id: params.mpPreferenceId || null,
      paid_at: isPrepaid ? new Date().toISOString() : null,
    })
    .select('*')
    .single();

  if (error || !data) {
    console.error('[story-promotion] create order error:', error?.message);
    return null;
  }

  return data as StoryPromotionOrderRow;
}

export async function fulfillStoryPromotionOrder(orderId: string): Promise<void> {
  const { error } = await supabaseAdmin.rpc('fn_fulfill_story_order', {
    p_order_id: orderId,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function markStoryOrderPaid(orderId: string, mpPaymentId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('story_promotion_orders')
    .update({
      status: 'paid',
      mp_payment_id: mpPaymentId,
      paid_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .eq('status', 'pending');

  if (error) throw new Error(error.message);
}

export async function getStoryOrderById(orderId: string): Promise<StoryPromotionOrderRow | null> {
  const { data, error } = await supabaseAdmin
    .from('story_promotion_orders')
    .select('*')
    .eq('id', orderId)
    .maybeSingle();

  if (error || !data) return null;
  return data as StoryPromotionOrderRow;
}
