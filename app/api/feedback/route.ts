import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Email opcional para notificaciones (configurar en .env.local)
const NOTIFICATION_EMAIL = process.env.FEEDBACK_NOTIFICATION_EMAIL;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { feedbacks } = body;

    console.log('📥 Feedback recibido:', { count: feedbacks?.length, feedbacks });

    if (!Array.isArray(feedbacks) || feedbacks.length === 0) {
      console.error('❌ Array de feedbacks inválido o vacío');
      return NextResponse.json(
        { error: 'Se requiere un array de feedbacks' },
        { status: 400 }
      );
    }

    if (!supabase) {
      console.error('⚠️ Supabase no está configurado');
      return NextResponse.json(
        { error: 'Servicio no configurado' },
        { status: 500 }
      );
    }

    // Insertar todos los feedbacks en la base de datos
    const feedbacksToInsert = feedbacks.map((f: any) => ({
      id: f.id,
      tipo: f.tipo,
      texto: f.texto,
      fecha: f.fecha,
      hora: f.hora,
      url: f.url || null,
      user_agent: f.userAgent || null,
      leido: false
    }));

    console.log('💾 Intentando insertar en Supabase:', feedbacksToInsert);

    let data, error;
    try {
      const result = await supabase
        .from('feedback')
        .insert(feedbacksToInsert)
        .select();
      
      data = result.data;
      error = result.error;
    } catch (fetchError: any) {
      // Error de red/conexión
      console.error('❌ Error de conexión a Supabase:', {
        message: fetchError.message,
        cause: fetchError.cause,
        stack: fetchError.stack
      });
      
      // Si es un error de timeout o conexión, intentar guardar en localStorage como fallback
      return NextResponse.json(
        { 
          error: 'Error de conexión a Supabase',
          details: 'No se pudo conectar al servidor. El feedback se guardó localmente y se enviará cuando la conexión se restablezca.',
          code: 'CONNECTION_ERROR',
          fallback: true
        },
        { status: 503 } // Service Unavailable
      );
    }

    if (error) {
      console.error('❌ Error al guardar feedback en Supabase:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        error
      });
      
      // Si es un error de RLS o permisos, dar mensaje más específico
      if (error.code === 'PGRST301' || error.message?.includes('permission denied')) {
        return NextResponse.json(
          { 
            error: 'Error de permisos',
            details: 'Las políticas de seguridad no están configuradas correctamente. Verifica las políticas RLS en Supabase.',
            code: error.code
          },
          { status: 403 }
        );
      }
      
      return NextResponse.json(
        { 
          error: 'Error al guardar feedback',
          details: error.message,
          code: error.code
        },
        { status: 500 }
      );
    }

    console.log('✅ Feedback guardado exitosamente:', data);

    // Opcional: Enviar notificación por email si está configurado
    if (NOTIFICATION_EMAIL && feedbacks.length > 0) {
      try {
        await enviarNotificacionEmail(feedbacks);
      } catch (emailError) {
        // No fallar si el email falla, solo loguear
        console.error('Error al enviar notificación por email:', emailError);
      }
    }

    return NextResponse.json({
      success: true,
      saved: data?.length || 0,
      message: 'Feedback guardado correctamente'
    });
  } catch (error: any) {
    console.error('Error en API de feedback:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Función opcional para enviar notificación por email
async function enviarNotificacionEmail(feedbacks: any[]) {
  if (!NOTIFICATION_EMAIL) return;

  // Opción 1: Usar Resend (gratis hasta 3,000 emails/mes)
  // Necesitas instalar: npm install resend
  // Y agregar RESEND_API_KEY en .env.local
  
  // Opción 2: Usar SendGrid
  // Opción 3: Usar Nodemailer con SMTP
  
  // Por ahora, solo logueamos (puedes implementar después)
  console.log(`📧 Nuevo feedback recibido (${feedbacks.length}):`, {
    tipo: feedbacks[0].tipo,
    texto: feedbacks[0].texto.substring(0, 100) + '...',
    email: NOTIFICATION_EMAIL
  });

  // TODO: Implementar envío real de email
  // Ejemplo con Resend:
  /*
  const { Resend } = require('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);
  
  await resend.emails.send({
    from: 'feedback@buscadis.com',
    to: NOTIFICATION_EMAIL,
    subject: `Nuevo ${feedbacks[0].tipo}: ${feedbacks[0].texto.substring(0, 50)}...`,
    html: `
      <h2>Nuevo feedback recibido</h2>
      <p><strong>Tipo:</strong> ${feedbacks[0].tipo}</p>
      <p><strong>Mensaje:</strong></p>
      <p>${feedbacks[0].texto}</p>
      <p><strong>Fecha:</strong> ${feedbacks[0].fecha} ${feedbacks[0].hora}</p>
      <p><strong>URL:</strong> ${feedbacks[0].url || 'N/A'}</p>
    `
  });
  */
}

