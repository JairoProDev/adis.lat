import { supabase } from './supabase';
import { BusinessProfile } from '@/types/business';

export const BUSINESS_TABLE = 'business_profiles';

export async function getBusinessProfile(userId: string): Promise<BusinessProfile | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
        .from(BUSINESS_TABLE)
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        console.error('Error fetching business profile:', error);
        return null;
    }

    return data as BusinessProfile;
}

export async function getBusinessProfileBySlug(slug: string): Promise<BusinessProfile | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
        .from(BUSINESS_TABLE)
        .select('*')
        .eq('slug', slug)
        .single();

    if (error) {
        console.error('Error fetching business profile by slug:', error);
        return null;
    }

    return data as BusinessProfile;
}

export async function createBusinessProfile(profile: Partial<BusinessProfile>): Promise<BusinessProfile | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
        .from(BUSINESS_TABLE)
        .insert([profile])
        .select()
        .single();

    if (error) {
        console.error('Error creating business profile:', error);
        throw error;
    }

    return data as BusinessProfile;
}

export async function updateBusinessProfile(userId: string, updates: Partial<BusinessProfile>): Promise<BusinessProfile | null> {
    if (!supabase) return null;

    // Remove fields that shouldn't be updated directly or are read-only
    const { id, created_at, updated_at, ...cleanUpdates } = updates as any;

    const { data, error } = await supabase
        .from(BUSINESS_TABLE)
        .update({ ...cleanUpdates, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .select()
        .single();

    if (error) {
        console.error('Error updating business profile:', error);
        throw error;
    }

    return data as BusinessProfile;
}

export async function checkSlugAvailability(slug: string): Promise<boolean> {
    if (!supabase) return false;

    const { count, error } = await supabase
        .from(BUSINESS_TABLE)
        .select('id', { count: 'exact', head: true })
        .eq('slug', slug);

    if (error) {
        console.error('Error checking slug:', error);
        return false;
    }

    return count === 0;
}
