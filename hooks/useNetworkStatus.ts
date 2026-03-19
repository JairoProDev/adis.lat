/**
 * 🌐 useNetworkStatus - Hook para detectar estado de conexión
 *
 * Provee:
 * - isOnline: boolean
 * - wasOffline: boolean (si estuvo offline en esta sesión)
 * - connectionType: 'slow' | 'fast' | 'unknown'
 */
'use client';

import { useState, useEffect, useCallback } from 'react';

export interface NetworkStatus {
  isOnline: boolean;
  wasOffline: boolean;          // Si en algún momento de la sesión estuvo offline
  justCameOnline: boolean;      // Recién recuperó conexión (true solo por 3 segundos)
  connectionType: 'slow-2g' | '2g' | '3g' | '4g' | 'unknown';
}

const getConnectionType = (): NetworkStatus['connectionType'] => {
  if (typeof navigator === 'undefined') return 'unknown';
  const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  if (!conn) return 'unknown';
  return conn.effectiveType || 'unknown';
};

export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [wasOffline, setWasOffline] = useState(false);
  const [justCameOnline, setJustCameOnline] = useState(false);
  const [connectionType, setConnectionType] = useState<NetworkStatus['connectionType']>(getConnectionType());

  const handleOnline = useCallback(() => {
    setIsOnline(true);
    setJustCameOnline(true);
    setConnectionType(getConnectionType());
    // Solo marcar justCameOnline por 3 segundos
    setTimeout(() => setJustCameOnline(false), 3000);
  }, []);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
    setWasOffline(true);
    setJustCameOnline(false);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Estado inicial real
    setIsOnline(navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Escuchar cambios de tipo de conexión
    const conn = (navigator as any).connection;
    if (conn) {
      const handleChange = () => setConnectionType(getConnectionType());
      conn.addEventListener('change', handleChange);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        conn.removeEventListener('change', handleChange);
      };
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return { isOnline, wasOffline, justCameOnline, connectionType };
}
