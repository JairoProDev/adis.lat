import { NextRequest, NextResponse } from 'next/server';
import { 
  getAvisosFromSupabase, 
  createAvisoInSupabase 
} from '@/lib/supabase';
import { Aviso } from '@/types';
import { generarIdUnico } from '@/lib/utils';

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
    
    // Si el body ya tiene un aviso completo con id, usarlo directamente
    // Si no, crear uno nuevo
    let nuevoAviso: Aviso;
    
    if (body.id && body.fechaPublicacion && body.horaPublicacion) {
      // El aviso ya está completo, usarlo tal cual
      nuevoAviso = body as Aviso;
    } else {
      // Crear un nuevo aviso
      const ahora = new Date();
      const fecha = ahora.toISOString().split('T')[0];
      const hora = ahora.toTimeString().split(' ')[0].substring(0, 5);

      // Usar el ID del body si existe, sino generar uno nuevo
      const idUnico = body.id || generarIdUnico();

      nuevoAviso = {
        id: idUnico,
        categoria: body.categoria,
        titulo: body.titulo,
        descripcion: body.descripcion,
        contacto: body.contacto,
        ubicacion: body.ubicacion,
        tamaño: body.tamaño || 'miniatura',
        fechaPublicacion: body.fechaPublicacion || fecha,
        horaPublicacion: body.horaPublicacion || hora,
        imagenesUrls: body.imagenesUrls || undefined,
        // Compatibilidad hacia atrás
        imagenUrl: body.imagenUrl || body.imagenesUrls?.[0] || undefined,
        esGratuito: body.esGratuito || false
      };
    }

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
    } else if (error?.code === 'PGRST204' && error?.message?.includes('tamaño')) {
      errorMessage = 'La columna "tamaño" no existe en la tabla avisos. Ejecuta el script SQL "supabase-avisos-tamaño.sql" en Supabase.';
      statusCode = 500;
    } else if (error?.code === 'PGRST204') {
      errorMessage = `Columna no encontrada en la base de datos: ${error?.message || 'Error desconocido'}. Verifica el esquema de la base de datos.`;
      statusCode = 500;
    }
    
    return NextResponse.json(
      { error: errorMessage, details: error?.message, code: error?.code },
      { status: statusCode }
    );
  }
}
