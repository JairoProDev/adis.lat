import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export async function checkId(id: string) {
    if (!supabase) return { error: 'No supabase' };
    const { data, error } = await supabase
        .from('adisos')
        .select('id')
        .eq('id', id)
        .single();
    return { data, error };
}

(async () => {
    const id = 'yhzCkN67yu'; // From screenshot
    console.log(`Checking ID: ${id}`);
    const result = await checkId(id);
    console.log('Result:', JSON.stringify(result, null, 2));
})();
