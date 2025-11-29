import { NextRequest, NextResponse } from 'next/server';
import { getAvisoByIdFromSupabase } from '@/lib/supabase';

// Esta función maneja GET para obtener un aviso por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const aviso = await getAvisoByIdFromSupabase(id);
    
    if (!aviso) {
      return NextResponse.json(
        { error: 'Aviso no encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(aviso);
  } catch (error: any) {
    console.error('Error al obtener aviso:', error);
    
    // Si es un error de timeout o conexión, retornar un error más descriptivo
    if (error?.message?.includes('timeout') || error?.message?.includes('fetch failed')) {
      return NextResponse.json(
        { error: 'Error de conexión con la base de datos. Verifica tu conexión a internet y las políticas de Supabase.' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al obtener aviso' },
      { status: 500 }
    );
  }
}
