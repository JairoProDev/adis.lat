
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''; // Use ANON key first to simulate client
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const admin = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

async function check() {
    console.log('--- Checking DB Status ---');

    // Use admin if available to bypass RLS for status check
    const client = admin || supabase;

    // 1. Count Adisos
    const { count: total, error: err1 } = await client.from('adisos').select('*', { count: 'exact', head: true });
    if (err1) console.error('Error counting total:', err1);
    console.log('Total Adisos:', total);

    // 2. Count Active
    const { count: active, error: err2 } = await client.from('adisos').select('*', { count: 'exact', head: true }).eq('esta_activo', true);
    if (err2) console.error('Error counting active:', err2);
    console.log('Active Adisos:', active);

    // 3. Count Embeddings
    const { count: withEmb, error: err3 } = await client.from('adisos').select('*', { count: 'exact', head: true }).not('embedding', 'is', null);
    console.log('With Embeddings:', withEmb);

    // 4. Count Search Vector
    // Note: tsvector not directly queryable with 'is not null' easily in some clients, but let's try
    const { count: withVec, error: err4 } = await client.from('adisos').select('*', { count: 'exact', head: true }).not('search_vector', 'is', null);
    console.log('With Search Vector:', withVec);

    // 5. Test RPC
    console.log('\n--- Testing RPC match_adisos_hybrid ---');
    // Need an embedding for query. Let's make a dummy one or use 0s if function allows, but function calculates distance.
    // We'll generate a dummy embedding of length 1536
    const dummyEmbedding = new Array(1536).fill(0.01);

    const { data, error } = await supabase.rpc('match_adisos_hybrid', {
        query_embedding: dummyEmbedding,
        query_text: 'test',
        match_threshold: 0.0, // Ultra low threshold
        match_count: 5,
        filter_category: null,
        filter_location: null,
        only_active: false // Check even inactive
    });

    if (error) {
        console.error('RPC Error:', error);
    } else {
        console.log('RPC Results:', data?.length);
        if (data && data.length > 0) {
            console.log('Sample result:', JSON.stringify(data[0], null, 2));
        } else {
            console.log("No results returned from RPC even with threshold 0.0 and only_active=false");
        }
    }

    // Check RLS policies if anonymous
    console.log('\n--- Checking RLS (Adisos) ---');
    const { data: rlsData, error: rlsError } = await supabase.from('adisos').select('id').limit(1);
    if (rlsError) {
        console.log('Anon SELECT Error:', rlsError);
    } else {
        console.log('Anon SELECT Success. Retrieved:', rlsData?.length, 'rows');
    }
}

check().catch(console.error);
