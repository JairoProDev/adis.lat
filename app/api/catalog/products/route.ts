/**
 * API Route: CRUD for Catalog Products
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Helper to check auth and get profile
async function checkAuthAndGetProfile() {
    if (!supabase) {
        throw new Error('Supabase no configurado');
    }

    const { data: { user }, error: authError } = await supabase!.auth.getUser();
    if (authError || !user) {
        return { error: 'No autenticado', status: 401 };
    }

    const { data: profile } = await supabase!
        .from('business_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

    if (!profile) {
        return { error: 'Perfil de negocio no encontrado', status: 404 };
    }

    return { user, profile };
}

// ============================================================
// GET: List Products
// ============================================================

export async function GET(request: NextRequest) {
    try {
        const auth = await checkAuthAndGetProfile();
        if ('error' in auth) {
            return NextResponse.json(
                { success: false, error: auth.error },
                { status: auth.status }
            );
        }

        const { profile } = auth;
        const { searchParams } = new URL(request.url);

        // Parse filters
        const status = searchParams.get('status');
        const category = searchParams.get('category');
        const search = searchParams.get('search');
        const page = parseInt(searchParams.get('page') || '1');
        const perPage = parseInt(searchParams.get('per_page') || '20');

        // Build query
        let query = supabase!
            .from('catalog_products')
            .select('*', { count: 'exact' })
            .eq('business_profile_id', profile.id);

        if (status) {
            query = query.eq('status', status);
        }

        if (category) {
            query = query.eq('category', category);
        }

        if (search) {
            query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
        }

        // Pagination
        const from = (page - 1) * perPage;
        const to = from + perPage - 1;

        query = query
            .order('created_at', { ascending: false })
            .range(from, to);

        const { data: products, error, count } = await query;

        if (error) {
            throw error;
        }

        return NextResponse.json({
            success: true,
            items: products || [],
            total: count || 0,
            page,
            per_page: perPage,
            has_more: count ? (page * perPage) < count : false
        });

    } catch (error: any) {
        console.error('Get products error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// ============================================================
// POST: Create Product
// ============================================================

export async function POST(request: NextRequest) {
    try {
        const auth = await checkAuthAndGetProfile();
        if ('error' in auth) {
            return NextResponse.json(
                { success: false, error: auth.error },
                { status: auth.status }
            );
        }

        const { profile } = auth;
        const body = await request.json();

        // Validate required fields
        if (!body.title) {
            return NextResponse.json(
                { success: false, error: 'El título es requerido' },
                { status: 400 }
            );
        }

        // Create product
        const { data: product, error } = await supabase!
            .from('catalog_products')
            .insert({
                business_profile_id: profile.id,
                title: body.title,
                description: body.description,
                price: body.price,
                compare_at_price: body.compare_at_price,
                currency: body.currency || 'PEN',
                category: body.category,
                tags: body.tags || [],
                attributes: body.attributes || {},
                images: body.images || [],
                sku: body.sku,
                barcode: body.barcode,
                stock: body.stock,
                track_inventory: body.track_inventory || false,
                status: body.status || 'draft',
                ai_metadata: body.ai_metadata || {}
            })
            .select()
            .single();

        if (error) {
            throw error;
        }

        return NextResponse.json({
            success: true,
            data: product,
            message: 'Producto creado correctamente'
        });

    } catch (error: any) {
        console.error('Create product error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// ============================================================
// PUT: Update Product
// ============================================================

export async function PUT(request: NextRequest) {
    try {
        const auth = await checkAuthAndGetProfile();
        if ('error' in auth) {
            return NextResponse.json(
                { success: false, error: auth.error },
                { status: auth.status }
            );
        }

        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('id');

        if (!productId) {
            return NextResponse.json(
                { success: false, error: 'ID de producto requerido' },
                { status: 400 }
            );
        }

        const body = await request.json();

        // Update product
        const { data: product, error } = await supabase!
            .from('catalog_products')
            .update({
                ...body,
                updated_at: new Date().toISOString()
            })
            .eq('id', productId)
            .select()
            .single();

        if (error) {
            throw error;
        }

        return NextResponse.json({
            success: true,
            data: product,
            message: 'Producto actualizado correctamente'
        });

    } catch (error: any) {
        console.error('Update product error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// ============================================================
// DELETE: Delete Product
// ============================================================

export async function DELETE(request: NextRequest) {
    try {
        const auth = await checkAuthAndGetProfile();
        if ('error' in auth) {
            return NextResponse.json(
                { success: false, error: auth.error },
                { status: auth.status }
            );
        }

        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('id');

        if (!productId) {
            return NextResponse.json(
                { success: false, error: 'ID de producto requerido' },
                { status: 400 }
            );
        }

        // Delete product
        const { error } = await supabase!
            .from('catalog_products')
            .delete()
            .eq('id', productId);

        if (error) {
            throw error;
        }

        return NextResponse.json({
            success: true,
            message: 'Producto eliminado correctamente'
        });

    } catch (error: any) {
        console.error('Delete product error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
