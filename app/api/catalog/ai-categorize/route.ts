/**
 * AI Catalog Categorizer
 * POST /api/catalog/ai-categorize
 *
 * Given the business's existing products, uses Gemini to suggest
 * a clean category structure and assigns each product to a category.
 * Returns suggestions grouped by category — the user confirms and applies.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'nodejs';
export const maxDuration = 120;

const MODEL = 'gemini-2.0-flash-exp';

interface ProductRow {
    id: string;
    title: string;
    category: string | null;
}

interface CategorySuggestion {
    category: string;
    products: { id: string; title: string; currentCategory: string | null }[];
}

// ── Auth helper (mirrors the import route) ─────────────────────────────────
async function authenticate(request: NextRequest) {
    const supabase = await createServerClient();
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];

    if (token && token !== 'undefined') {
        try {
            const { data: sessionData, error } = await supabase.auth.setSession({
                access_token: token,
                refresh_token: token,
            });
            if (error) {
                const { data: { user } } = await supabase.auth.getUser(token);
                return user;
            }
            return sessionData.user;
        } catch {
            const { data: { user } } = await supabase.auth.getUser(token);
            return user;
        }
    } else {
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    }
}

// ── Gemini categorize (batched for large catalogs) ─────────────────────────
async function categorizeWithAI(
    products: ProductRow[],
    sectorHint?: string
): Promise<{ id: string; category: string }[]> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: MODEL });

    const sectorCtx = sectorHint ? `\nEl negocio es del sector: ${sectorHint}.` : '';

    // For large catalogs, split into batches of 200
    const BATCH_SIZE = 200;
    const results: { id: string; category: string }[] = [];

    for (let i = 0; i < products.length; i += BATCH_SIZE) {
        const batch = products.slice(i, i + BATCH_SIZE);

        const prompt = `Eres un experto en organización de catálogos comerciales.${sectorCtx}

Tu tarea: asigna UNA categoría a cada producto de la siguiente lista.

REGLAS:
- Usa entre 5 y 20 categorías para todo este lote
- Nombres de categoría: cortos (1-3 palabras), en español, capitalizados
- Agrupa productos similares bajo la misma categoría exacta
- Cubre todos los índices del 0 al ${batch.length - 1}

PRODUCTOS:
${batch.map((p, idx) => `${idx}. ${p.title.slice(0, 120)}`).join('\n')}

Responde SOLO con JSON válido, sin texto adicional:
{"assignments":[{"index":0,"category":"Pinturas"},{"index":1,"category":"Herramientas"}]}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) continue;

        let parsed: { assignments?: { index: number; category: string }[] };
        try {
            parsed = JSON.parse(jsonMatch[0]);
        } catch {
            continue;
        }

        for (const a of parsed.assignments || []) {
            const product = batch[a.index];
            if (product && a.category) {
                results.push({ id: product.id, category: a.category.trim() });
            }
        }
    }

    return results;
}

// ── POST handler ───────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
    try {
        const user = await authenticate(request);
        if (!user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { data: profile, error: profileError } = await supabaseAdmin
            .from('business_profiles')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (profileError || !profile) {
            return NextResponse.json({ error: 'Perfil de negocio no encontrado' }, { status: 404 });
        }

        const body = await request.json().catch(() => ({}));
        const { all = false, sector } = body as { all?: boolean; sector?: string };

        // Get products to categorize
        let query = supabaseAdmin
            .from('catalog_products')
            .select('id, title, category')
            .eq('business_profile_id', profile.id)
            .not('title', 'is', null)
            .neq('title', '');

        // Default: only products without a category
        if (!all) {
            query = query.or('category.is.null,category.eq.');
        }

        const { data: products, error: productsError } = await query;

        if (productsError) {
            return NextResponse.json({ error: productsError.message }, { status: 500 });
        }

        if (!products || products.length === 0) {
            return NextResponse.json({
                success: true,
                total: 0,
                suggestions: [],
                message: 'Todos los productos ya tienen categoría',
            });
        }

        // Run AI categorization
        const assignments = await categorizeWithAI(products as ProductRow[], sector);

        // Group by suggested category
        const grouped = new Map<string, CategorySuggestion>();

        for (const a of assignments) {
            const original = products.find(p => p.id === a.id);
            if (!original) continue;

            if (!grouped.has(a.category)) {
                grouped.set(a.category, { category: a.category, products: [] });
            }
            grouped.get(a.category)!.products.push({
                id: a.id,
                title: original.title,
                currentCategory: (original as ProductRow).category,
            });
        }

        // Sort by number of products descending
        const suggestions = Array.from(grouped.values()).sort(
            (a, b) => b.products.length - a.products.length
        );

        return NextResponse.json({
            success: true,
            total: products.length,
            categorized: assignments.length,
            suggestions,
        });
    } catch (err: any) {
        console.error('AI categorize error:', err);
        return NextResponse.json(
            { error: err.message || 'Error al categorizar' },
            { status: 500 }
        );
    }
}

// ── PATCH: apply selected suggestions ─────────────────────────────────────
export async function PATCH(request: NextRequest) {
    try {
        const user = await authenticate(request);
        if (!user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { data: profile } = await supabaseAdmin
            .from('business_profiles')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (!profile) {
            return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 });
        }

        const { assignments } = await request.json() as {
            assignments: { productId: string; category: string }[];
        };

        if (!assignments?.length) {
            return NextResponse.json({ error: 'No hay asignaciones' }, { status: 400 });
        }

        // Apply in parallel batches of 50
        const CHUNK = 50;
        let applied = 0;

        for (let i = 0; i < assignments.length; i += CHUNK) {
            const chunk = assignments.slice(i, i + CHUNK);

            // Group by category for efficient updates
            const byCategory = new Map<string, string[]>();
            for (const a of chunk) {
                if (!byCategory.has(a.category)) byCategory.set(a.category, []);
                byCategory.get(a.category)!.push(a.productId);
            }

            await Promise.all(
                Array.from(byCategory.entries()).map(([category, ids]) =>
                    supabaseAdmin
                        .from('catalog_products')
                        .update({ category, updated_at: new Date().toISOString() })
                        .in('id', ids)
                        .eq('business_profile_id', profile.id)
                )
            );

            applied += chunk.length;
        }

        return NextResponse.json({ success: true, applied });
    } catch (err: any) {
        console.error('Apply categories error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
