'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Adiso } from '@/types';
import { getWhatsAppUrl } from '@/lib/utils';
import Header from '@/components/Header';

interface AdisoPageContentProps {
  adiso: Adiso;
}

export default function AdisoPageContent({ adiso }: AdisoPageContentProps) {
  const router = useRouter();

  // Redirigir a la página principal con el adiso en query param para mantener compatibilidad
  // Pero mostrar contenido completo para SEO
  useEffect(() => {
    // Solo redirigir si estamos en cliente y no es un bot
    if (typeof window !== 'undefined' && !navigator.userAgent.match(/bot|crawler|spider|crawling/i)) {
      router.replace(`/?adiso=${adiso.id}`, { scroll: false });
    }
  }, [adiso.id, router]);

  const categoriaLabels: Record<string, string> = {
    empleos: 'Empleos',
    inmuebles: 'Inmuebles',
    vehiculos: 'Vehículos',
    servicios: 'Servicios',
    productos: 'Productos',
    eventos: 'Eventos',
    negocios: 'Negocios',
    comunidad: 'Comunidad',
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-secondary)' }}>
      <Header onChangelogClick={() => router.push('/progreso')} />
      <main style={{ flex: 1, padding: '2rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        <article itemScope itemType="https://schema.org/Product">
          <meta itemProp="name" content={adiso.titulo} />
          <meta itemProp="description" content={adiso.descripcion || ''} />
          
          <div style={{ marginBottom: '1rem' }}>
            <span style={{ 
              fontSize: '0.875rem', 
              color: 'var(--text-tertiary)',
              textTransform: 'capitalize'
            }}>
              {categoriaLabels[adiso.categoria] || adiso.categoria}
            </span>
          </div>
          
          <h1 style={{ 
            fontSize: '2rem', 
            fontWeight: 600, 
            color: 'var(--text-primary)',
            marginBottom: '1rem',
            lineHeight: 1.3
          }}>
            {adiso.titulo}
          </h1>
          
          {adiso.imagenesUrls && adiso.imagenesUrls.length > 0 && (
            <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {adiso.imagenesUrls.map((url, index) => (
                <div key={index} style={{ position: 'relative', width: '100%', height: '400px', borderRadius: '8px', overflow: 'hidden' }}>
                  <Image
                    src={url}
                    alt={`${adiso.titulo} - Imagen ${index + 1}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 800px"
                    style={{ objectFit: 'cover' }}
                    loading={index === 0 ? 'eager' : 'lazy'}
                    itemProp="image"
                  />
                </div>
              ))}
            </div>
          )}
          
          {adiso.descripcion && (
            <div style={{ 
              fontSize: '1rem', 
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              marginBottom: '1.5rem',
              whiteSpace: 'pre-wrap'
            }} itemProp="description">
              {adiso.descripcion}
            </div>
          )}
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            padding: '1.5rem',
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            marginBottom: '1.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <strong style={{ color: 'var(--text-primary)' }}>Ubicación:</strong>
              <span style={{ color: 'var(--text-secondary)' }}>{adiso.ubicacion}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <strong style={{ color: 'var(--text-primary)' }}>Publicado:</strong>
              <span style={{ color: 'var(--text-secondary)' }}>
                {new Date(`${adiso.fechaPublicacion}T${adiso.horaPublicacion}:00`).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>
          
          <a
            href={getWhatsAppUrl(adiso.contacto, adiso.titulo, adiso.categoria, adiso.id)}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.875rem 1.5rem',
              backgroundColor: '#25D366',
              color: 'white',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '1rem',
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
            aria-label={`Contactar al publicador de ${adiso.titulo} por WhatsApp`}
          >
            Contactar por WhatsApp
          </a>
        </article>
      </main>
    </div>
  );
}

