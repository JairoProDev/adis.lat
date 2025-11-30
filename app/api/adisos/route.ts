import { NextRequest, NextResponse } from 'next/server';
import { 
  getAdisosFromSupabase, 
  createAdisoInSupabase 
} from '@/lib/supabase';
import { Adiso } from '@/types';
import { generarIdUnico } from '@/lib/utils';

// Esta función maneja GET para obtener todos los adisos
export async function GET() {
  try {
    const adisos = await getAdisosFromSupabase();
    return NextResponse.json(adisos);
  } catch (error: any) {
    console.error('Error al obtener adisos:', error);
    
    // Mensajes más descriptivos
    let errorMessage = 'Error al obtener adisos';
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

// Esta función maneja POST para crear un nuevo adiso
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Si el body ya tiene un adiso completo con id, usarlo directamente
    // Si no, crear uno nuevo
    let nuevoAdiso: Adiso;
    
    if (body.id && body.fechaPublicacion && body.horaPublicacion) {
      // El adiso ya está completo, usarlo tal cual
      nuevoAdiso = body as Adiso;
    } else {
      // Crear un nuevo adiso
      const ahora = new Date();
      const fecha = ahora.toISOString().split('T')[0];
      const hora = ahora.toTimeString().split(' ')[0].substring(0, 5);

      // Usar el ID del body si existe, sino generar uno nuevo
      const idUnico = body.id || generarIdUnico();

      nuevoAdiso = {
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

    const adisoCreado = await createAdisoInSupabase(nuevoAdiso);
    
    return NextResponse.json(adisoCreado, { status: 201 });
  } catch (error: any) {
    console.error('Error al crear adiso:', error);
    
    // Mensajes más descriptivos
    let errorMessage = 'Error al crear adiso';
    let statusCode = 500;
    
    if (error?.message?.includes('políticas de seguridad') || error?.message?.includes('permission denied')) {
      errorMessage = 'Las políticas de seguridad no están configuradas. Ejecuta el SQL de seguridad en Supabase.';
      statusCode = 403;
    } else if (error?.message?.includes('timeout') || error?.message?.includes('fetch failed')) {
      errorMessage = 'Error de conexión con Supabase. Verifica tu conexión y las credenciales.';
      statusCode = 503;
    } else if (error?.message?.includes('duplicado')) {
      errorMessage = 'Este adiso ya existe.';
      statusCode = 409;
    } else if (error?.code === 'PGRST204' && error?.message?.includes('tamaño')) {
      errorMessage = 'La columna "tamaño" no existe en la tabla adisos. Ejecuta el script SQL "supabase-adisos-tamaño.sql" en Supabase.';
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
