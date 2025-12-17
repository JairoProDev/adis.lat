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

export async function uploadBusinessImage(file: File, userId: string, type: 'logo' | 'banner'): Promise<string | null> {
    if (!supabase) return null;

    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/${type}-${Date.now()}.${fileExt}`;

        // Use 'public-assets' bucket or 'business-media' or create one. 
        // Let's assume 'business-media' exists or we'll error out.
        // Actually, typically 'public' or 'images' is used.
        // Let's use 'business-images'.
        const bucketName = 'business-images';

        const { error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            console.error('Error uploading image to storage:', uploadError);
            return null;
        }

        const { data } = supabase.storage
            .from(bucketName)
            .getPublicUrl(fileName);

        return data.publicUrl;
    } catch (e) {
        console.error("Exception uploading image:", e);
        return null;
    }
}
