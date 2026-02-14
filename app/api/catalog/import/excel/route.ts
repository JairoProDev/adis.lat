/**
 * CATALOG AI - Excel Import API
 * 
 * Endpoint: POST /api/catalog/import/excel
 * 
 * Flujo:
 * 1. Parse Excel file
 * 2. AI-powered column detection & mapping
 * 3. Product normalization
 * 4. Duplicate detection
 * 5. Create import session
 * 6. Return results for review
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { ExcelParser } from '@/lib/ai/excel-parser';
import { ProductNormalizer } from '@/lib/ai/product-normalizer';
import { DuplicateDetector } from '@/lib/ai/duplicate-detector';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for large files

interface ImportStats {
    totalRows: number;
    productsToCreate: number;
    duplicatesFound: number;
    errors: number;
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerClient();

        // 1. Verify authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Get business profile
        const { data: profile } = await supabase
            .from('business_profiles')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (!profile) {
            return NextResponse.json({ error: 'Business profile not found' }, { status: 404 });
        }

        // 3. Get file from form data
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Validate file type
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        if (!['xlsx', 'xls', 'csv'].includes(fileExtension || '')) {
            return NextResponse.json({
                error: 'Invalid file type. Please upload Excel (.xlsx, .xls) or CSV file.'
            }, { status: 400 });
        }

        // 4. Create import session
        const { data: importSession, error: sessionError } = await supabase
            .from('import_sessions')
            .insert({
                business_profile_id: profile.id,
                source_type: 'excel',
                source_file_name: file.name,
                status: 'processing',
                created_by: user.id,
                started_at: new Date().toISOString()
            })
            .select()
            .single();

        if (sessionError || !importSession) {
            console.error('Error creating import session:', sessionError);
            return NextResponse.json({ error: 'Failed to create import session' }, { status: 500 });
        }

        // 5. Parse Excel file
        const buffer = await file.arrayBuffer();
        const excelParser = new ExcelParser();
        const parsedData = await excelParser.parse(Buffer.from(buffer));

        if (parsedData.rows.length === 0) {
            await supabase
                .from('import_sessions')
                .update({ status: 'failed', error_details: { message: 'No data found in file' } })
                .eq('id', importSession.id);

            return NextResponse.json({ error: 'No data found in file' }, { status: 400 });
        }

        // 6. AI Column Mapping
        const normalizer = new ProductNormalizer();
        const columnMapping = await normalizer.detectColumns(parsedData.headers, parsedData.rows[0]);

        // 7. Normalize products
        const normalizedProducts = [];
        const errors = [];

        for (let i = 0; i < parsedData.rows.length; i++) {
            try {
                const normalized = await normalizer.normalize(parsedData.rows[i], columnMapping);
                normalizedProducts.push({
                    ...normalized,
                    importRowNumber: i + 2, // +2 because Excel is 1-indexed and we skip header
                    import_source: 'excel',
                    import_source_file: file.name
                });
            } catch (error: any) {
                errors.push({
                    row: i + 2,
                    error: error.message
                });
            }
        }

        // 8. Duplicate Detection
        const duplicateDetector = new DuplicateDetector(supabase);
        const detectionResults = await duplicateDetector.detectBatch(
            normalizedProducts,
            profile.id
        );

        // 9. Separate intoCreate vs Review
        const toCreate = detectionResults.filter(r => !r.isDuplicate);
        const toReview = detectionResults.filter(r => r.isDuplicate);

        // 10. Store duplicate candidates for review
        if (toReview.length > 0) {
            const duplicateCandidates = toReview.map(item => ({
                import_session_id: importSession.id,
                new_product_data: item.product,
                existing_product_id: item.matchedProduct?.id,
                similarity_score: item.score,
                match_reasons: item.reasons
            }));

            await supabase
                .from('duplicate_candidates')
                .insert(duplicateCandidates);
        }

        // 11. Auto-create products with low duplicate risk (can be configurable)
        const autoCreateThreshold = 0.5; // Si score < 0.5, auto-crear
        const autoCreate = toCreate.filter(r => (r.score || 0) < autoCreateThreshold);

        let productsCreated = 0;
        if (autoCreate.length > 0) {
            const productsToInsert = autoCreate.map(r => ({
                ...r.product,
                business_profile_id: profile.id,
                status: 'draft', // Start as draft until reviewed
                import_confidence: 1 - (r.score || 0)
            }));

            const { error: insertError } = await supabase
                .from('catalog_products')
                .insert(productsToInsert);

            if (!insertError) {
                productsCreated = productsToInsert.length;
            }
        }

        // 12. Update import session
        const stats: ImportStats = {
            totalRows: parsedData.rows.length,
            productsToCreate: autoCreate.length,
            duplicatesFound: toReview.length,
            errors: errors.length
        };

        await supabase
            .from('import_sessions')
            .update({
                status: toReview.length > 0 ? 'review_needed' : 'completed',
                total_rows: stats.totalRows,
                products_created: productsCreated,
                duplicates_found: stats.duplicatesFound,
                errors_count: stats.errors,
                error_details: errors.length > 0 ? { errors } : null,
                processing_log: {
                    columnMapping,
                    stats
                },
                completed_at: new Date().toISOString()
            })
            .eq('id', importSession.id);

        // 13. Return results
        return NextResponse.json({
            success: true,
            sessionId: importSession.id,
            stats,
            columnMapping,
            needsReview: toReview.length > 0,
            duplicates: toReview.map(r => ({
                newProduct: r.product,
                existingProduct: r.matchedProduct,
                score: r.score,
                reasons: r.reasons
            })),
            errors: errors.length > 0 ? errors.slice(0, 10) : [] // Limit to first 10
        });

    } catch (error: any) {
        console.error('Excel import error:', error);
        return NextResponse.json({
            error: 'Import failed',
            details: error.message
        }, { status: 500 });
    }
}

// GET endpoint to check status of an import
export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get('sessionId');

        if (!sessionId) {
            return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
        }

        const { data: session, error } = await supabase
            .from('import_sessions')
            .select(`
                *,
                duplicate_candidates (
                    id,
                    new_product_data,
                    existing_product_id,
                    similarity_score,
                    match_reasons,
                    resolution
                )
            `)
            .eq('id', sessionId)
            .single();

        if (error || !session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        return NextResponse.json(session);

    } catch (error: any) {
        return NextResponse.json({
            error: 'Failed to fetch session',
            details: error.message
        }, { status: 500 });
    }
}
