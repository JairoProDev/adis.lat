import { NextRequest, NextResponse } from 'next/server';
import { supabase } from './supabase';
import * as crypto from 'crypto';

/**
 * Verifica una API Key desde el header X-API-Key
 * Retorna la API key si es válida, null si no
 */
export async function verificarApiKey(request: NextRequest): Promise<{ valida: boolean; key?: any; error?: string }> {
  const apiKey = request.headers.get('X-API-Key') || request.headers.get('x-api-key');
  
  if (!apiKey) {
    return { valida: false, error: 'API Key no proporcionada' };
  }
  
  if (!supabase) {
    return { valida: false, error: 'Servicio no configurado' };
  }
  
  try {
    // Hash de la API key proporcionada
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
    
    // Buscar en la base de datos
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('key_hash', keyHash)
      .eq('activa', true)
      .single();
    
    if (error || !data) {
      return { valida: false, error: 'API Key inválida' };
    }
    
    // Verificar expiración
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return { valida: false, error: 'API Key expirada' };
    }
    
    // Actualizar last_used_at
    await supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', data.id);
    
    return { valida: true, key: data };
  } catch (error: any) {
    console.error('Error al verificar API Key:', error);
    return { valida: false, error: 'Error al verificar API Key' };
  }
}

/**
 * Middleware para autenticación de API Key
 * Usar en rutas de API que requieren autenticación
 */
export async function requireApiKey(request: NextRequest): Promise<NextResponse | null> {
  const verificacion = await verificarApiKey(request);
  
  if (!verificacion.valida) {
    return NextResponse.json(
      { error: verificacion.error || 'No autorizado' },
      { status: 401 }
    );
  }
  
  return null; // null significa que la autenticación pasó
}

/**
 * Genera un hash de API Key (para almacenar en BD)
 */
export function hashApiKey(apiKey: string): string {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

/**
 * Genera una nueva API Key aleatoria
 */
export function generarApiKey(): string {
  return 'adis_' + crypto.randomBytes(32).toString('hex');
}





