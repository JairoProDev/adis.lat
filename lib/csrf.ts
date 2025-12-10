// Protección CSRF básica
// En producción, usar tokens más robustos o SameSite cookies

import { cookies } from 'next/headers';

const CSRF_TOKEN_NAME = 'csrf-token';
const CSRF_TOKEN_LENGTH = 32;

// Generar token CSRF
export function generateCSRFToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < CSRF_TOKEN_LENGTH; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Verificar token CSRF
export async function verifyCSRFToken(token: string | null): Promise<boolean> {
  if (!token) return false;
  
  try {
    // En el servidor, obtener el token de las cookies
    const cookieStore = await cookies();
    const storedToken = cookieStore.get(CSRF_TOKEN_NAME)?.value;
    
    if (!storedToken) return false;
    
    // Comparar tokens (timing-safe comparison)
    if (token.length !== storedToken.length) return false;
    
    let result = 0;
    for (let i = 0; i < token.length; i++) {
      result |= token.charCodeAt(i) ^ storedToken.charCodeAt(i);
    }
    
    return result === 0;
  } catch (error) {
    console.error('Error al verificar CSRF token:', error);
    return false;
  }
}

// Obtener token CSRF del cliente
export function getCSRFToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  // Intentar obtener de cookie
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === CSRF_TOKEN_NAME) {
      return decodeURIComponent(value);
    }
  }
  
  return null;
}

// Establecer token CSRF en cookie (cliente)
export function setCSRFToken(token: string): void {
  if (typeof window === 'undefined') return;
  
  // Cookie con SameSite=Strict para protección CSRF
  const expires = new Date();
  expires.setTime(expires.getTime() + 24 * 60 * 60 * 1000); // 24 horas
  
  document.cookie = `${CSRF_TOKEN_NAME}=${encodeURIComponent(token)}; expires=${expires.toUTCString()}; path=/; SameSite=Strict; Secure`;
}













