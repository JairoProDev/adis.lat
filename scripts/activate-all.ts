
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function activate() {
    // Dynamic import to avoid early init issues
    const { supabaseAdmin } = await import('../lib/supabase-admin');

    console.log('--- Activating All Adisos ---');

    if (!supabaseAdmin) {
        console.error('Supabase Admin not initialized');
        return;
    }

    // Count inactive first
    const { count: inactiveCount, error: countError } = await supabaseAdmin
        .from('adisos')
        .select('*', { count: 'exact', head: true })
        .eq('esta_activo', false);

    if (countError) {
        console.error('Error counting inactive:', countError);
        return;
    }

    console.log(`Found ${inactiveCount} inactive adisos.`);

    if (inactiveCount === 0) {
        console.log('All adisos are already active.');
        return;
    }

    // Update
    console.log('Updating...');
    const { error: updateError, count } = await supabaseAdmin
        .from('adisos')
        .update({ esta_activo: true })
        .eq('esta_activo', false)
        .select('', { count: 'exact' });

    if (updateError) {
        console.error('Error updating:', updateError);
    } else {
        console.log(`Successfully activated ${count ?? 'all'} adisos.`);
    }
}

activate().catch(console.error);
