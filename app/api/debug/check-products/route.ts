import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { guardDebugRoute } from '@/lib/debug-route-guard';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const denied = guardDebugRoute(request);
    if (denied) return denied;

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const slug = searchParams.get('slug');

    let profile;

    if (userId) {
        const { data } = await supabaseAdmin
            .from('business_profiles')
            .select('id')
            .eq('user_id', userId)
            .single();
        profile = data;
    } else if (slug) {
        const { data } = await supabaseAdmin
            .from('business_profiles')
            .select('id')
            .eq('slug', slug)
            .single();
        profile = data;
    } else {
        return NextResponse.json({ error: 'userId or slug required' });
    }

    if (!profile) return NextResponse.json({ error: 'Profile not found' });

    // 2. Count products
    const { count, error } = await supabaseAdmin
        .from('catalog_products')
        .select('*', { count: 'exact', head: true })
        .eq('business_profile_id', profile.id);

    // 3. Get first 5
    const { data: products } = await supabaseAdmin
        .from('catalog_products')
        .select('id, title, status, business_profile_id')
        .eq('business_profile_id', profile.id)
        .limit(5);

    return NextResponse.json({
        profileId: profile.id,
        productCount: count,
        error,
        sample: products
    });
}
