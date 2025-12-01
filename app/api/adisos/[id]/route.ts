import { NextRequest, NextResponse } from 'next/server';
import { deleteAdisoInSupabase, getAdisoByIdFromSupabase, updateAdisoInSupabase } from '@/lib/supabase';
import { Adiso } from '@/types';
import { createAdisoSchema, sanitizeText } from '@/lib/validations';
import { rateLimit, getClientIP } from '@/lib/rate-limit';

// GET: Obtener un adiso por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const ip = getClientIP(request);
  const limitResult = rateLimit(`get-adiso-${ip}`, {
    windowMs: 60 * 1000,
    maxRequests: 120,
  });

  if (!limitResult.allowed) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Por favor intenta más tarde.' },
      { status: 429 }
    );
  }

  try {
    const { id } = params;
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
    return NextResponse.json(
      { error: 'Error al obtener adiso', details: error?.message },
      { status: 500 }
    );
  }
}

// PUT: Actualizar un adiso
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const ip = getClientIP(request);
  const limitResult = rateLimit(`put-adiso-${ip}`, {
    windowMs: 60 * 1000,
    maxRequests: 20,
  });

  if (!limitResult.allowed) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Por favor intenta más tarde.' },
      { status: 429 }
    );
  }

  try {
    const { id } = params;
    const body = await request.json();

    // Validar que el ID coincida
    if (body.id && body.id !== id) {
      return NextResponse.json(
        { error: 'El ID del body no coincide con el ID de la URL' },
        { status: 400 }
      );
    }

    // Validar y sanitizar entrada
    const validationResult = createAdisoSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Datos de entrada inválidos',
          details: validationResult.error.issues.map(e => ({
            path: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    // Verificar que el adiso existe
    const adisoExistente = await getAdisoByIdFromSupabase(id);
    if (!adisoExistente) {
      return NextResponse.json(
        { error: 'Adiso no encontrado' },
        { status: 404 }
      );
    }

    // Sanitizar campos de texto
    const sanitizedData = {
      ...validatedData,
      titulo: sanitizeText(validatedData.titulo),
      descripcion: validatedData.descripcion 
        ? sanitizeText(validatedData.descripcion) 
        : adisoExistente.descripcion, // Mantener descripción existente si no se proporciona
      ubicacion: sanitizeText(validatedData.ubicacion),
      contacto: sanitizeText(validatedData.contacto),
    };

    // Actualizar el adiso (mantener fechas originales)
    const adisoActualizado: Adiso = {
      ...adisoExistente,
      ...sanitizedData,
      id, // Asegurar que el ID no cambie
      fechaPublicacion: adisoExistente.fechaPublicacion,
      horaPublicacion: adisoExistente.horaPublicacion,
    };

    const resultado = await updateAdisoInSupabase(adisoActualizado);

    return NextResponse.json(resultado);
  } catch (error: any) {
    console.error('Error al actualizar adiso:', error);
    let errorMessage = 'Error al actualizar adiso';
    let statusCode = 500;

    if (error?.message?.includes('políticas de seguridad') || error?.message?.includes('permission denied')) {
      errorMessage = 'No tienes permiso para actualizar este adiso.';
      statusCode = 403;
    } else if (error?.message?.includes('no encontrado')) {
      errorMessage = 'Adiso no encontrado.';
      statusCode = 404;
    }

    return NextResponse.json(
      { error: errorMessage, details: error?.message },
      { status: statusCode }
    );
  }
}

// DELETE: Eliminar un adiso
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const ip = getClientIP(request);
  const limitResult = rateLimit(`delete-adiso-${ip}`, {
    windowMs: 60 * 1000,
    maxRequests: 10,
  });

  if (!limitResult.allowed) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Por favor intenta más tarde.' },
      { status: 429 }
    );
  }

  try {
    const { id } = params;

    // Verificar que el adiso existe
    const adisoExistente = await getAdisoByIdFromSupabase(id);
    if (!adisoExistente) {
      return NextResponse.json(
        { error: 'Adiso no encontrado' },
        { status: 404 }
      );
    }

    // Eliminar el adiso
    await deleteAdisoInSupabase(id);

    return NextResponse.json(
      { success: true, message: 'Adiso eliminado correctamente' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error al eliminar adiso:', error);
    let errorMessage = 'Error al eliminar adiso';
    let statusCode = 500;

    if (error?.message?.includes('políticas de seguridad') || error?.message?.includes('permission denied')) {
      errorMessage = 'No tienes permiso para eliminar este adiso.';
      statusCode = 403;
    } else if (error?.message?.includes('no encontrado')) {
      errorMessage = 'Adiso no encontrado.';
      statusCode = 404;
    }

    return NextResponse.json(
      { error: errorMessage, details: error?.message },
      { status: statusCode }
    );
  }
}
