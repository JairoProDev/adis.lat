import { NextRequest, NextResponse } from 'next/server';
import { createAvisoGratuitoInSupabase, getAvisosGratuitosFromSupabase } from '@/lib/supabase';
import { generarIdUnico } from '@/lib/utils';
import { AvisoGratuito } from '@/types';

export async function GET() {
  try {
    const avisos = await getAvisosGratuitosFromSupabase();
    return NextResponse.json(avisos, { status: 200 });
  } catch (error: any) {
    console.error('Error al obtener avisos gratuitos:', error);
    
    let errorMessage = 'Error al obtener avisos gratuitos';
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
    
    // Validaciones estrictas para avisos gratuitos
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

    const nuevoAviso: AvisoGratuito = {
      id: generarIdUnico(),
      categoria: body.categoria,
      titulo: body.titulo.trim(),
      contacto: body.contacto.trim(),
      fechaCreacion,
      fechaExpiracion
    };

    const avisoCreado = await createAvisoGratuitoInSupabase(nuevoAviso);
    
    return NextResponse.json(avisoCreado, { status: 201 });
  } catch (error: any) {
    console.error('Error al crear aviso gratuito:', error);
    
    let errorMessage = 'Error al crear aviso gratuito';
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

