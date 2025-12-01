'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AdisoGratuito } from '@/types';
import { fetchAdisosGratuitos } from '@/lib/api';

interface AdisosGratuitosCacheContextType {
  adisosGratuitos: AdisoGratuito[];
  cargando: boolean;
  error: boolean;
  cargarAdisos: () => Promise<void>;
  agregarAdiso: (adiso: AdisoGratuito) => void;
  removerAdiso: (adisoId: string) => void;
  limpiarCache: () => void;
}

const AdisosGratuitosCacheContext = createContext<AdisosGratuitosCacheContextType | undefined>(undefined);

export function AdisosGratuitosCacheProvider({ children }: { children: ReactNode }) {
  const [adisosGratuitos, setAdisosGratuitos] = useState<AdisoGratuito[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(false);
  const [yaCargado, setYaCargado] = useState(false);

  const cargarAdisos = async () => {
    // Si ya están cargados, no volver a cargar
    if (yaCargado && adisosGratuitos.length >= 0) {
      return;
    }

    // Si ya está cargando, no iniciar otra carga
    if (cargando) {
      return;
    }

    setCargando(true);
    setError(false);

    try {
      const adisos = await fetchAdisosGratuitos();
      setAdisosGratuitos(adisos);
      setYaCargado(true);
      setError(false);
    } catch (error: any) {
      console.error('Error al cargar adisos gratuitos:', error);
      // Si la tabla no existe aún (error 500/503), simplemente no mostrar error
      if (error?.message?.includes('Error al obtener adisos gratuitos')) {
        setError(true);
      }
      // Aún así marcamos como cargado para no intentar de nuevo
      setYaCargado(true);
    } finally {
      setCargando(false);
    }
  };

  const agregarAdiso = (adiso: AdisoGratuito) => {
    setAdisosGratuitos(prev => {
      // Evitar duplicados
      if (prev.some(a => a.id === adiso.id)) {
        // Si ya existe, actualizarlo
        return prev.map(a => a.id === adiso.id ? adiso : a);
      }
      // Si no existe, agregarlo al inicio
      return [adiso, ...prev];
    });
  };

  const removerAdiso = (adisoId: string) => {
    setAdisosGratuitos(prev => prev.filter(a => a.id !== adisoId));
  };

  const limpiarCache = () => {
    setAdisosGratuitos([]);
    setYaCargado(false);
    setError(false);
  };

  return (
    <AdisosGratuitosCacheContext.Provider
      value={{
        adisosGratuitos,
        cargando,
        error,
        cargarAdisos,
        agregarAdiso,
        removerAdiso,
        limpiarCache
      }}
    >
      {children}
    </AdisosGratuitosCacheContext.Provider>
  );
}

export function useAdisosGratuitosCache() {
  const context = useContext(AdisosGratuitosCacheContext);
  if (context === undefined) {
    throw new Error('useAdisosGratuitosCache debe usarse dentro de un AdisosGratuitosCacheProvider');
  }
  return context;
}

