
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        console.log('Starting fix-catalog script...');

        // 1. Get all products with missing user_id
        const { data: products, error: fetchError } = await supabaseAdmin
            .from('catalog_products')
            .select('id, business_profile_id')
            .is('user_id', null);

        if (fetchError) {
            return NextResponse.json({ error: 'Failed to fetch products', details: fetchError }, { status: 500 });
        }

        console.log(`Found ${products?.length || 0} products with missing user_id`);

        if (!products || products.length === 0) {
            return NextResponse.json({ message: 'No products to fix' });
        }

        // 2. Group by business_profile_id to minimize queries
        const profileIds = [...new Set(products.map(p => p.business_profile_id))];
        console.log(` unique profiles: ${profileIds.length}`);

        let updatedCount = 0;

        for (const profileId of profileIds) {
            // Get user_id for this profile
            const { data: profile, error: profileError } = await supabaseAdmin
                .from('business_profiles')
                .select('user_id')
                .eq('id', profileId)
                .single();

            if (profileError || !profile) {
                console.error(`Profile ${profileId} not found or error`, profileError);
                continue;
            }

            // Update all products for this profile
            const { error: updateError, count } = await supabaseAdmin
                .from('catalog_products')
                .update({ user_id: profile.user_id })
                .eq('business_profile_id', profileId)
                .is('user_id', null); // Only update nulls

            if (updateError) {
                console.error(`Error updating products for profile ${profileId}`, updateError);
            } else {
                console.log(`Updated products for profile ${profileId}`);
                updatedCount += (products.filter(p => p.business_profile_id === profileId).length);
                // Note: count is not returned by update without select usually, so logic above is approximate but fine for logging
            }
        }

        return NextResponse.json({
            success: true,
            message: `Fixed user_id for ~${updatedCount} products across ${profileIds.length} profiles`
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
