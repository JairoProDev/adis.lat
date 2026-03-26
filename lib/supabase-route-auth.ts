import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import type { User } from '@supabase/supabase-js';

/**
 * Resuelve el usuario en Route Handlers de Next usando:
 * 1) Bearer token (access JWT de Supabase), si viene en Authorization
 * 2) Sesión por cookies (SSR)
 *
 * No usa setSession con refresh_token ficticio: evita estados inconsistentes.
 */
export async function getUserFromRouteRequest(request: NextRequest): Promise<User | null> {
  const supabase = await createServerClient();
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.split(' ')[1];

  if (token && token !== 'undefined') {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (!error && user) {
      return user;
    }
  }

  const { data: { user }, error } = await supabase.auth.getUser();
  if (!error && user) {
    return user;
  }

  return null;
}
