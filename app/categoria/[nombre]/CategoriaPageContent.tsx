'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Adiso, Categoria } from '@/types';
import Header from '@/components/Header';
import GrillaAdisos from '@/components/GrillaAdisos';
import Breadcrumbs from '@/components/Breadcrumbs';

interface CategoriaPageContentProps {
  categoria: Categoria;
  adisos: Adiso[];
}

const categoriaLabels: Record<Categoria, string> = {
  empleos: 'Empleos',
  inmuebles: 'Inmuebles',
  vehiculos: 'Vehículos',
  servicios: 'Servicios',
  productos: 'Productos',
  eventos: 'Eventos',
  negocios: 'Negocios',
  comunidad: 'Comunidad',
};

export default function CategoriaPageContent({ categoria, adisos }: CategoriaPageContentProps) {
  const router = useRouter();

  // Redirigir a la página principal con filtro de categoría para mantener compatibilidad
  useEffect(() => {
    // Solo redirigir si estamos en cliente y no es un bot
    if (typeof window !== 'undefined' && !navigator.userAgent.match(/bot|crawler|spider|crawling/i)) {
      router.replace(`/?categoria=${categoria}`, { scroll: false });
    }
  }, [categoria, router]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-secondary)' }}>
      <Header 
        breadcrumbs={[
          { label: 'Inicio', href: '/' },
          { label: categoriaLabels[categoria] },
        ]}
      />
      <main style={{ flex: 1, padding: '1rem', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        <div itemScope itemType="https://schema.org/CollectionPage">
          <meta itemProp="name" content={categoriaLabels[categoria]} />
          
          <h1 style={{ 
            fontSize: '2rem', 
            fontWeight: 600, 
            color: 'var(--text-primary)',
            marginBottom: '1rem',
            textTransform: 'capitalize'
          }}>
            {categoriaLabels[categoria]}
          </h1>
          
          <p style={{ 
            fontSize: '1rem', 
            color: 'var(--text-secondary)',
            marginBottom: '2rem'
          }}>
            {adisos.length} {adisos.length === 1 ? 'adiso encontrado' : 'adisos encontrados'}
          </p>

          {adisos.length > 0 ? (
            <GrillaAdisos
              adisos={adisos}
              onAbrirAdiso={(adiso) => {
                router.push(`/?adiso=${adiso.id}`);
              }}
              adisoSeleccionadoId={null}
            />
          ) : (
            <div style={{
              padding: '3rem',
              textAlign: 'center',
              color: 'var(--text-secondary)'
            }}>
              <p>No hay adisos en esta categoría todavía.</p>
              <button
                onClick={() => router.push('/?categoria=' + categoria)}
                style={{
                  marginTop: '1rem',
                  padding: '0.75rem 1.5rem',
                  backgroundColor: 'var(--text-primary)',
                  color: 'var(--bg-primary)',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: 600,
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-secondary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--text-primary)';
                }}
              >
                Ver todos los adisos
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

