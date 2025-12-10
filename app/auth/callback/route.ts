import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code && supabase) {
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error('Error al intercambiar código por sesión:', error);
        return NextResponse.redirect(new URL('/?error=auth_error', requestUrl.origin));
      }
    } catch (error) {
      console.error('Error en callback de autenticación:', error);
      return NextResponse.redirect(new URL('/?error=auth_error', requestUrl.origin));
    }
  }

  // Redirigir a la página principal después de autenticación
  return NextResponse.redirect(new URL('/', requestUrl.origin));
}











