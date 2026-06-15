import { supabaseAdmin } from '@/lib/supabase-admin';
import { PAQUETES, TamañoPaquete } from '@/types';

export type PackageOrderStatus = 'pending' | 'paid' | 'failed' | 'cancelled' | 'dev_bypass';

export interface PackageOrderRow {
  id: string;
  user_id: string;
  adiso_id: string | null;
  package_tier: TamañoPaquete;
  amount_pen: number;
  status: PackageOrderStatus;
  draft_payload: Record<string, unknown>;
  mp_preference_id: string | null;
  interested_users_count: number;
}

export function getPackagePrice(tier: TamañoPaquete): number {
  return PAQUETES[tier]?.precio ?? 0;
}

export async function createPackageOrder(params: {
  userId: string;
  packageTier: TamañoPaquete;
  draftPayload: Record<string, unknown>;
  status?: PackageOrderStatus;
  mpPreferenceId?: string;
  adisoId?: string;
}): Promise<PackageOrderRow | null> {
  const amount = getPackagePrice(params.packageTier);
  const isPrepaid = params.status === 'paid' || params.status === 'dev_bypass';

  const { data, error } = await supabaseAdmin
    .from('adiso_package_orders')
    .insert({
      user_id: params.userId,
      adiso_id: params.adisoId || null,
      package_tier: params.packageTier,
      amount_pen: amount,
      status: params.status || (amount > 0 ? 'pending' : 'paid'),
      draft_payload: params.draftPayload,
      mp_preference_id: params.mpPreferenceId || null,
      paid_at: isPrepaid ? new Date().toISOString() : null,
    })
    .select('*')
    .single();

  if (error || !data) {
    console.error('[package] create order error:', error?.message);
    return null;
  }
  return data as PackageOrderRow;
}

export async function getPackageOrder(orderId: string): Promise<PackageOrderRow | null> {
  const { data, error } = await supabaseAdmin
    .from('adiso_package_orders')
    .select('*')
    .eq('id', orderId)
    .maybeSingle();

  if (error || !data) return null;
  return data as PackageOrderRow;
}

export async function markPackageOrderPaid(orderId: string, mpPaymentId?: string): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from('adiso_package_orders')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      mp_payment_id: mpPaymentId || null,
    })
    .eq('id', orderId)
    .in('status', ['pending']);

  return !error;
}

export async function updatePackageOrderAdiso(orderId: string, adisoId: string): Promise<void> {
  await supabaseAdmin
    .from('adiso_package_orders')
    .update({ adiso_id: adisoId, updated_at: new Date().toISOString() })
    .eq('id', orderId);
}

export function isPackageDevBypassEnabled(): boolean {
  return process.env.PACKAGE_DEV_BYPASS === 'true' && process.env.NODE_ENV !== 'production';
}
