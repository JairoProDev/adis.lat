/**
 * Backfill qr_codes for existing business_profiles.
 * Run: npx tsx scripts/backfill-qr-codes.ts
 */
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function main() {
  const supabase = createClient(url, key);
  const { data: profiles, error } = await supabase
    .from('business_profiles')
    .select('id, slug, theme_color');

  if (error) throw error;

  const { ensureQrCodeForBusiness } = await import('../lib/qr/service');
  let created = 0;
  for (const p of profiles || []) {
    const qr = await ensureQrCodeForBusiness({
      businessProfileId: p.id,
      slug: p.slug,
      themeColor: p.theme_color,
    });
    if (qr) created++;
  }
  console.log(`Backfill complete: ${created}/${profiles?.length ?? 0} QR codes ensured.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
