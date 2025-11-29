import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { leido } = body;

    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase no está configurado' },
        { status: 500 }
      );
    }

    const { data, error } = await supabase
      .from('feedback')
      .update({ leido })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error al actualizar feedback:', error);
      return NextResponse.json(
        { error: 'Error al actualizar feedback' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, feedback: data });
  } catch (error: any) {
    console.error('Error en API de actualizar feedback:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

