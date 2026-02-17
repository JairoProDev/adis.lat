/**
 * API Route: Upload Files to Supabase Storage
 * Handles PDF, images, Excel uploads for catalog import
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_FILE_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv'
];

export async function POST(request: NextRequest) {
    try {
        if (!supabase) {
            return NextResponse.json(
                { success: false, error: 'Supabase no configurado' },
                { status: 500 }
            );
        }

        // Check authentication
        const { data: { user }, error: authError } = await supabase!.auth.getUser();
        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: 'No autenticado' },
                { status: 401 }
            );
        }

        // Get business profile
        const { data: profile, error: profileError } = await supabase!
            .from('business_profiles')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (profileError || !profile) {
            return NextResponse.json(
                { success: false, error: 'Perfil de negocio no encontrado' },
                { status: 404 }
            );
        }

        // Parse form data
        const formData = await request.formData();
        const files = formData.getAll('files') as File[];

        if (!files || files.length === 0) {
            return NextResponse.json(
                { success: false, error: 'No se enviaron archivos' },
                { status: 400 }
            );
        }

        // Validate files
        for (const file of files) {
            if (file.size > MAX_FILE_SIZE) {
                return NextResponse.json(
                    { success: false, error: `Archivo ${file.name} excede 50MB` },
                    { status: 400 }
                );
            }

            if (!ALLOWED_FILE_TYPES.includes(file.type)) {
                return NextResponse.json(
                    { success: false, error: `Tipo de archivo ${file.type} no permitido` },
                    { status: 400 }
                );
            }
        }

        // Upload files to Supabase Storage
        const uploadedFiles = [];

        for (const file of files) {
            const fileExt = file.name.split('.').pop();
            const fileName = `${profile.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `catalog-imports/${fileName}`;

            const { data, error: uploadError } = await supabase!.storage
                .from('catalog-files')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                console.error('Upload error:', uploadError);
                return NextResponse.json(
                    { success: false, error: `Error al subir ${file.name}: ${uploadError.message}` },
                    { status: 500 }
                );
            }

            // Get public URL
            const { data: { publicUrl } } = supabase!.storage
                .from('catalog-files')
                .getPublicUrl(filePath);

            uploadedFiles.push({
                name: file.name,
                size: file.size,
                type: file.type,
                url: publicUrl,
                path: filePath
            });
        }

        return NextResponse.json({
            success: true,
            files: uploadedFiles,
            message: `${uploadedFiles.length} archivo(s) subido(s) correctamente`
        });

    } catch (error: any) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Error al procesar archivos' },
            { status: 500 }
        );
    }
}
