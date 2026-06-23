import { supabaseAdmin } from '@/lib/supabase-admin';
import { normalizeBusinessProfile } from '@/lib/business/normalize-profile';
import type { BusinessProfile } from '@/types/business';

/** Lookup de perfil con service role (APIs QR — evita fallos RLS del cliente anónimo). */
export async function getBusinessProfileBySlugAdmin(
  slug: string
): Promise<BusinessProfile | null> {
  const { data, error } = await supabaseAdmin
    .from('business_profiles')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    console.error('[qr] profile admin lookup:', error.message);
    return null;
  }
  if (!data) return null;
  return normalizeBusinessProfile(data as BusinessProfile) as BusinessProfile;
}
