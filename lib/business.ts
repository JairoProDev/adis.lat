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

export async function getBusinessCatalog(businessProfileId: string): Promise<any[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('catalog_products')
        .select('*')
        .eq('business_profile_id', businessProfileId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching catalog:', error);
        return [];
    }

    return data || [];
}

export async function getBusinessProductAsAdiso(productId: string): Promise<any | null> {
    if (!supabase) return null;

    try {
        // Fetch product and business profile
        const { data: product, error } = await supabase
            .from('catalog_products')
            .select(`
                *,
                business_profiles (
                    id,
                    name,
                    slug,
                    contact_phone,
                    contact_whatsapp,
                    contact_address,
                    contact_email,
                    logo_url
                )
            `)
            .eq('id', productId)
            .single();

        if (error || !product) {
            // Try fetching by slug if not UUID
            if (error?.code === '22P02') return null; // Invalid UUID
            return null;
        }

        const business = product.business_profiles;

        // Map to Adiso
        // Note: Using 'any' return type temporarily to match Adiso interface looseness or just return mapped object
        // The consumer expects Adiso-like object
        return {
            id: product.id,
            titulo: product.title,
            descripcion: product.description,
            precio: product.price,
            imagenesUrls: product.images || [],
            imagenUrl: product.images?.[0] || '',
            categoria: product.category || 'Otros',
            ubicacion: business?.contact_address || 'Ubicación no especificada',
            usuarioId: product.user_id,
            slug: product.id, // Or product.slug if exists

            // Extra context for UI
            business: {
                id: business?.id,
                name: business?.name,
                slug: business?.slug,
                logoUrl: business?.logo_url,
                whatsapp: business?.contact_whatsapp
            },

            // Required Adiso fields (mocked/default)
            fechaPublicacion: product.created_at,
            horaPublicacion: new Date(product.created_at).toLocaleTimeString(),
            contacto: business?.contact_whatsapp || business?.contact_phone || '',
            vistas: product.view_count || 0,
            contactos: product.click_count || 0,
            estaActivo: product.status === 'published'
        };

    } catch (e) {
        console.error('Error fetching business product:', e);
        return null;
    }
}

export async function uploadProductImage(file: File, userId: string): Promise<string | null> {
    const bucketName = 'business-images';
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/products/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            console.error('Error uploading product image:', uploadError);
            return null;
        }

        const { data } = supabase.storage
            .from(bucketName)
            .getPublicUrl(fileName);

        return data.publicUrl;
    } catch (e) {
        console.error("Exception uploading product image:", e);
        return null;
    }
}

export async function updateCatalogProduct(productId: string, updates: any): Promise<any | null> {
    // updates should match catalog_products schema
    // e.g. { title, price, images, description, category }
    const { data, error } = await supabase
        .from('catalog_products')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', productId)
        .select()
        .single();

    if (error) {
        console.error('Error updating product:', error);
        return null;
    }

    return data;
}

export async function createCatalogProduct(product: any): Promise<any | null> {
    // product should include business_profile_id and user_id
    const { data, error } = await supabase
        .from('catalog_products')
        .insert([{ ...product }]) // created_at defaults to now()
        .select()
        .single();

    if (error) {
        console.error('Error creating product:', error);
        return null;
    }

    return data;
}

export async function deleteCatalogProduct(productId: string): Promise<boolean> {
    const { error } = await supabase
        .from('catalog_products')
        .delete()
        .eq('id', productId);

    if (error) {
        console.error('Error deleting product:', error);
        return false;
    }

    return true;
}

export async function deleteAllBusinessProducts(businessProfileId: string): Promise<boolean> {
    if (!supabase) return false;

    const { error } = await supabase
        .from('catalog_products')
        .delete()
        .eq('business_profile_id', businessProfileId);

    if (error) {
        console.error('Error deleting all products:', error);
        return false;
    }

    return true;
}
