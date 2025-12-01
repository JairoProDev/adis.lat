'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getFavoritos, eliminarFavorito } from '@/lib/favoritos';
import { Favorito, Adiso } from '@/types';
import { getAdisoByIdFromSupabase } from '@/lib/supabase';
import ModalAdiso from './ModalAdiso';
import { IconClose } from './Icons';

interface FavoritosListProps {
  abierto: boolean;
  onCerrar: () => void;
}

export default function FavoritosList({ abierto, onCerrar }: FavoritosListProps) {
  const { user } = useAuth();
  const [favoritos, setFavoritos] = useState<Favorito[]>([]);
  const [adisos, setAdisos] = useState<Adiso[]>([]);
  const [cargando, setCargando] = useState(false);
  const [adisoSeleccionado, setAdisoSeleccionado] = useState<Adiso | null>(null);

  useEffect(() => {
    if (abierto && user?.id) {
      cargarFavoritos();
    }
  }, [abierto, user?.id]);

  const cargarFavoritos = async () => {
    if (!user?.id) return;

    setCargando(true);
    try {
      const favoritosData = await getFavoritos(user.id);
      setFavoritos(favoritosData);

      // Cargar datos completos de los adisos
      const adisosPromises = favoritosData.map(async (favorito) => {
        try {
          const adiso = await getAdisoByIdFromSupabase(favorito.adiso_id);
          return adiso;
        } catch (error) {
          console.error(`Error al cargar adiso ${favorito.adiso_id}:`, error);
          return null;
        }
      });

      const adisosData = (await Promise.all(adisosPromises)).filter(
        (a): a is Adiso => a !== null
      );
      setAdisos(adisosData);
    } catch (error) {
      console.error('Error al cargar favoritos:', error);
    } finally {
      setCargando(false);
    }
  };

  const handleEliminarFavorito = async (adisoId: string) => {
    if (!user?.id) return;

    try {
      await eliminarFavorito(user.id, adisoId);
      setFavoritos(favoritos.filter(f => f.adiso_id !== adisoId));
      setAdisos(adisos.filter(a => a.id !== adisoId));
    } catch (error) {
      console.error('Error al eliminar favorito:', error);
      alert('Error al eliminar favorito');
    }
  };

  if (!abierto) return null;

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '1rem'
        }}
        onClick={onCerrar}
      >
        <div
          style={{
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '12px',
            padding: '1.5rem',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              ⭐ Mis Favoritos
            </h2>
            <button
              onClick={onCerrar}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                padding: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              aria-label="Cerrar"
            >
              <IconClose size={20} />
            </button>
          </div>

          {/* Lista de favoritos */}
          {cargando ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
              Cargando favoritos...
            </div>
          ) : adisos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
              No tienes favoritos guardados aún.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {adisos.map((adiso) => (
                <div
                  key={adiso.id}
                  style={{
                    padding: '1rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  onClick={() => setAdisoSeleccionado(adiso)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>
                        {adiso.titulo}
                      </h3>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                        {adiso.descripcion.substring(0, 100)}...
                      </p>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.5rem' }}>
                        {adiso.categoria} • {adiso.ubicacion}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEliminarFavorito(adiso.id);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#ef4444',
                        padding: '0.5rem',
                        fontSize: '1.25rem'
                      }}
                      aria-label="Eliminar de favoritos"
                    >
                      ⭐
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de adiso seleccionado */}
      {adisoSeleccionado && (
        <ModalAdiso
          adiso={adisoSeleccionado}
          onCerrar={() => setAdisoSeleccionado(null)}
          onAnterior={() => {
            const indice = adisos.findIndex(a => a.id === adisoSeleccionado.id);
            if (indice > 0) {
              setAdisoSeleccionado(adisos[indice - 1]);
            }
          }}
          onSiguiente={() => {
            const indice = adisos.findIndex(a => a.id === adisoSeleccionado.id);
            if (indice < adisos.length - 1) {
              setAdisoSeleccionado(adisos[indice + 1]);
            }
          }}
          puedeAnterior={adisos.findIndex(a => a.id === adisoSeleccionado.id) > 0}
          puedeSiguiente={adisos.findIndex(a => a.id === adisoSeleccionado.id) < adisos.length - 1}
        />
      )}
    </>
  );
}



