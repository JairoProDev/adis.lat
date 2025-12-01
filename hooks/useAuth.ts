import { useAuth as useAuthContext } from '@/contexts/AuthContext';

/**
 * Hook para acceder al contexto de autenticación
 * Re-exporta useAuth del contexto para mantener consistencia
 */
export function useAuth() {
  return useAuthContext();
}



