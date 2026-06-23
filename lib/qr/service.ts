import { supabaseAdmin } from '@/lib/supabase-admin';
import { createShortCode } from './short-code';
import { buildFreeStyleConfig } from './presets';
import type { QrCodeRecord, QrStyleConfig } from './types';

export async function getQrByShortCode(shortCode: string): Promise<QrCodeRecord | null> {
  const { data, error } = await supabaseAdmin
    .from('qr_codes')
    .select('*')
    .eq('short_code', shortCode)
    .eq('is_active', true)
    .maybeSingle();
  if (error || !data) return null;
  return data as QrCodeRecord;
}

export async function getQrByBusinessId(businessProfileId: string): Promise<QrCodeRecord | null> {
  const { data, error } = await supabaseAdmin
    .from('qr_codes')
    .select('*')
    .eq('business_profile_id', businessProfileId)
    .maybeSingle();
  if (error || !data) return null;
  return data as QrCodeRecord;
}

export async function getQrByBusinessSlug(slug: string): Promise<QrCodeRecord | null> {
  const { data: profile } = await supabaseAdmin
    .from('business_profiles')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();
  if (!profile?.id) return null;
  return getQrByBusinessId(profile.id);
}

async function insertUniqueQrCode(payload: {
  business_profile_id: string;
  destination_slug: string;
  theme_color?: string;
}): Promise<QrCodeRecord | null> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const short_code = createShortCode();
    const { data, error } = await supabaseAdmin
      .from('qr_codes')
      .insert({
        business_profile_id: payload.business_profile_id,
        short_code,
        destination_slug: payload.destination_slug,
        style_config: buildFreeStyleConfig(payload.theme_color),
      })
      .select()
      .single();
    if (!error && data) return data as QrCodeRecord;
    if (error?.code !== '23505') {
      console.error('[qr] insert error:', error);
      return null;
    }
  }
  return null;
}

/** Crea o actualiza el QR de un negocio (auto-provisión). */
export async function ensureQrCodeForBusiness(params: {
  businessProfileId: string;
  slug: string;
  themeColor?: string;
}): Promise<QrCodeRecord | null> {
  const existing = await getQrByBusinessId(params.businessProfileId);
  if (existing) {
    if (existing.destination_slug !== params.slug) {
      const { data } = await supabaseAdmin
        .from('qr_codes')
        .update({
          destination_slug: params.slug,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();
      return (data as QrCodeRecord) || existing;
    }
    return existing;
  }
  return insertUniqueQrCode({
    business_profile_id: params.businessProfileId,
    destination_slug: params.slug,
    theme_color: params.themeColor,
  });
}

export async function updateQrStyle(
  businessProfileId: string,
  styleConfig: QrStyleConfig,
  styleTier: 'free' | 'pro'
): Promise<QrCodeRecord | null> {
  const { data, error } = await supabaseAdmin
    .from('qr_codes')
    .update({
      style_config: styleConfig,
      style_tier: styleTier,
      updated_at: new Date().toISOString(),
    })
    .eq('business_profile_id', businessProfileId)
    .select()
    .single();
  if (error) {
    console.error('[qr] update style error:', error);
    return null;
  }
  return data as QrCodeRecord;
}

export function parseDeviceType(userAgent: string | null): string {
  if (!userAgent) return 'unknown';
  const ua = userAgent.toLowerCase();
  if (/tablet|ipad/.test(ua)) return 'tablet';
  if (/mobile|android|iphone/.test(ua)) return 'mobile';
  return 'desktop';
}

export async function recordQrScan(params: {
  qrCodeId: string;
  userAgent?: string | null;
  referrer?: string | null;
  country?: string | null;
  city?: string | null;
  sessionId?: string | null;
}): Promise<void> {
  const device_type = parseDeviceType(params.userAgent ?? null);
  await supabaseAdmin.from('qr_scans').insert({
    qr_code_id: params.qrCodeId,
    user_agent: params.userAgent?.slice(0, 512) ?? null,
    referrer: params.referrer?.slice(0, 512) ?? null,
    country: params.country ?? null,
    city: params.city ?? null,
    device_type,
    session_id: params.sessionId ?? null,
  });

  const { data: current } = await supabaseAdmin
    .from('qr_codes')
    .select('scan_count')
    .eq('id', params.qrCodeId)
    .single();

  await supabaseAdmin
    .from('qr_codes')
    .update({
      scan_count: (current?.scan_count ?? 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.qrCodeId);
}

export async function getQrScanStats(
  qrCodeId: string,
  days = 7
): Promise<{
  total: number;
  byDay: { date: string; count: number }[];
  byDevice: { device: string; count: number }[];
}> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data } = await supabaseAdmin
    .from('qr_scans')
    .select('scanned_at, device_type')
    .eq('qr_code_id', qrCodeId)
    .gte('scanned_at', since.toISOString());

  const rows = data || [];
  const dayMap = new Map<string, number>();
  const deviceMap = new Map<string, number>();

  for (const row of rows) {
    const day = row.scanned_at.slice(0, 10);
    dayMap.set(day, (dayMap.get(day) || 0) + 1);
    const dev = row.device_type || 'unknown';
    deviceMap.set(dev, (deviceMap.get(dev) || 0) + 1);
  }

  return {
    total: rows.length,
    byDay: [...dayMap.entries()]
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date)),
    byDevice: [...deviceMap.entries()].map(([device, count]) => ({ device, count })),
  };
}
