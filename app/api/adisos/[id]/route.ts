import { NextRequest, NextResponse } from 'next/server';
import { getAdisoByIdFromSupabase, createAdisoInSupabase, updateAdisoInSupabase } from '@/lib/supabase';
import { Adiso } from '@/types';

// Esta función maneja GET para obtener un adiso por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const adiso = await getAdisoByIdFromSupabase(id);
    
    if (!adiso) {
      return NextResponse.json(
        { error: 'Adiso no encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(adiso);
  } catch (error: any) {
    console.error('Error al obtener adiso:', error);
    
    // Si es un error de timeout o conexión, retornar un error más descriptivo
    if (error?.message?.includes('timeout') || error?.message?.includes('fetch failed')) {
      return NextResponse.json(
        { error: 'Error de conexión con la base de datos. Verifica tu conexión a internet y las políticas de Supabase.' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al obtener adiso' },
      { status: 500 }
    );
  }
}

// Esta función maneja PUT para actualizar un adiso existente
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const adisoActualizado: Adiso = {
      id: id,
      categoria: body.categoria,
      titulo: body.titulo,
      descripcion: body.descripcion,
      contacto: body.contacto,
      ubicacion: body.ubicacion,
      fechaPublicacion: body.fechaPublicacion,
      horaPublicacion: body.horaPublicacion,
      tamaño: body.tamaño || 'miniatura',
      imagenesUrls: body.imagenesUrls || undefined,
      imagenUrl: body.imagenUrl || body.imagenesUrls?.[0] || undefined,
      esGratuito: body.esGratuito || false
    };

    const adiso = await updateAdisoInSupabase(adisoActualizado);
    
    return NextResponse.json(adiso, { status: 200 });
  } catch (error: any) {
    console.error('Error al actualizar adiso:', error);
    
    let errorMessage = 'Error al actualizar adiso';
    let statusCode = 500;
    
    if (error?.message?.includes('políticas de seguridad') || error?.message?.includes('permission denied')) {
      errorMessage = 'Las políticas de seguridad no están configuradas. Ejecuta el SQL de seguridad en Supabase.';
      statusCode = 403;
    } else if (error?.message?.includes('timeout') || error?.message?.includes('fetch failed')) {
      errorMessage = 'Error de conexión con Supabase. Verifica tu conexión y las credenciales.';
      statusCode = 503;
    } else if (error?.code === 'PGRST116') {
      errorMessage = 'Adiso no encontrado.';
      statusCode = 404;
    }
    
    return NextResponse.json(
      { error: errorMessage, details: error?.message },
      { status: statusCode }
    );
  }
}
