import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getBusinessProfileBySlug } from '@/lib/business';

/** businessId is the public business slug */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  const { businessId } = await params;
  const profile = await getBusinessProfileBySlug(decodeURIComponent(businessId));
  if (!profile) {
    return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 });
  }

  const insights: Array<{
    id: string;
    userName: string;
    avatarUrl?: string;
    action: string;
  }> = [];

  const { data: reviews } = await supabaseAdmin
    .from('business_reviews')
    .select('id, customer_name, verified_purchase, created_at')
    .eq('business_profile_id', profile.id)
    .or('is_visible.is.null,is_visible.eq.true')
    .order('created_at', { ascending: false })
    .limit(10);

  for (const r of reviews || []) {
    const name = (r.customer_name as string | null)?.trim() || 'Alguien';
    const firstName = name.split(' ')[0];
    insights.push({
      id: `review-${r.id}`,
      userName: firstName,
      action: r.verified_purchase ? 'compró aquí' : 'dejó una reseña',
    });
  }

  if (profile.view_count && profile.view_count > 0) {
    insights.push({
      id: 'views-aggregate',
      userName: `${profile.view_count}`,
      action: 'personas vieron este perfil',
    });
  }

  return NextResponse.json({ insights: insights.slice(0, 8) });
}
