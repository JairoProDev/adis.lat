import { NextRequest, NextResponse } from 'next/server';
import { createAdisoGratuitoInSupabase, getAdisosGratuitosFromSupabase } from '@/lib/supabase';
import { generarIdUnico } from '@/lib/utils';
import { AdisoGratuito } from '@/types';

export async function GET() {
  try {
    const adisos = await getAdisosGratuitosFromSupabase();
    return NextResponse.json(adisos, { status: 200 });
  } catch (error: any) {
    console.error('Error al obtener adisos gratuitos:', error);
    
    let errorMessage = 'Error al obtener adisos gratuitos';
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validaciones estrictas para adisos gratuitos
    if (!body.titulo || typeof body.titulo !== 'string' || body.titulo.trim().length === 0) {
      return NextResponse.json(
        { error: 'El título es requerido' },
        { status: 400 }
      );
    }

    if (body.titulo.length > 30) {
      return NextResponse.json(
        { error: 'El título no puede exceder 30 caracteres' },
        { status: 400 }
      );
    }

    if (!body.categoria || !['empleos', 'inmuebles', 'vehiculos', 'servicios', 'productos', 'eventos', 'negocios', 'comunidad'].includes(body.categoria)) {
      return NextResponse.json(
        { error: 'La categoría es requerida y debe ser válida' },
        { status: 400 }
      );
    }

    if (!body.contacto || typeof body.contacto !== 'string' || body.contacto.trim().length === 0) {
      return NextResponse.json(
        { error: 'El número de contacto es requerido' },
        { status: 400 }
      );
    }

    const ahora = new Date();
    const fechaCreacion = ahora.toISOString();
    const fechaExpiracion = new Date(ahora.getTime() + 24 * 60 * 60 * 1000).toISOString(); // 1 día después

    const nuevoAdiso: AdisoGratuito = {
      id: generarIdUnico(),
      categoria: body.categoria,
      titulo: body.titulo.trim(),
      contacto: body.contacto.trim(),
      fechaCreacion,
      fechaExpiracion
    };

    const adisoCreado = await createAdisoGratuitoInSupabase(nuevoAdiso);
    
    return NextResponse.json(adisoCreado, { status: 201 });
  } catch (error: any) {
    console.error('Error al crear adiso gratuito:', error);
    
    let errorMessage = 'Error al crear adiso gratuito';
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

