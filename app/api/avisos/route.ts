import { NextRequest, NextResponse } from 'next/server';
import { 
  getAvisosFromSupabase, 
  createAvisoInSupabase 
} from '@/lib/supabase';
import { Aviso } from '@/types';

// Esta función maneja GET para obtener todos los avisos
export async function GET() {
  try {
    const avisos = await getAvisosFromSupabase();
    return NextResponse.json(avisos);
  } catch (error: any) {
    console.error('Error al obtener avisos:', error);
    
    // Mensajes más descriptivos
    let errorMessage = 'Error al obtener avisos';
    let statusCode = 500;
    
    if (error?.message?.includes('políticas de seguridad') || error?.message?.includes('permission denied')) {
      errorMessage = 'Las políticas de seguridad no están configuradas. Ejecuta el SQL de seguridad en Supabase.';
      statusCode = 403;
    } else if (error?.message?.includes('timeout') || error?.message?.includes('fetch failed')) {
      errorMessage = 'Error de conexión con Supabase. Verifica tu conexión y las credenciales.';
      statusCode = 503;
    }
    
    return NextResponse.json(
      { error: errorMessage, details: error?.message },
      { status: statusCode }
    );
  }
}

// Esta función maneja POST para crear un nuevo aviso
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const ahora = new Date();
    const fecha = ahora.toISOString().split('T')[0];
    const hora = ahora.toTimeString().split(' ')[0].substring(0, 5);

    // Generar ID único
    const idUnico = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const nuevoAviso: Aviso = {
      id: idUnico,
      categoria: body.categoria,
      titulo: body.titulo,
      descripcion: body.descripcion,
      contacto: body.contacto,
      ubicacion: body.ubicacion,
      fechaPublicacion: fecha,
      horaPublicacion: hora,
      imagenesUrls: body.imagenesUrls || undefined,
      // Compatibilidad hacia atrás
      imagenUrl: body.imagenUrl || body.imagenesUrls?.[0] || undefined
    };

    const avisoCreado = await createAvisoInSupabase(nuevoAviso);
    
    return NextResponse.json(avisoCreado, { status: 201 });
  } catch (error: any) {
    console.error('Error al crear aviso:', error);
    
    // Mensajes más descriptivos
    let errorMessage = 'Error al crear aviso';
    let statusCode = 500;
    
    if (error?.message?.includes('políticas de seguridad') || error?.message?.includes('permission denied')) {
      errorMessage = 'Las políticas de seguridad no están configuradas. Ejecuta el SQL de seguridad en Supabase.';
      statusCode = 403;
    } else if (error?.message?.includes('timeout') || error?.message?.includes('fetch failed')) {
      errorMessage = 'Error de conexión con Supabase. Verifica tu conexión y las credenciales.';
      statusCode = 503;
    } else if (error?.message?.includes('duplicado')) {
      errorMessage = 'Este aviso ya existe.';
      statusCode = 409;
    }
    
    return NextResponse.json(
      { error: errorMessage, details: error?.message },
      { status: statusCode }
    );
  }
}
