'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Adiso } from '@/types';

interface AdisoPageContentProps {
  adiso: Adiso;
}

export default function AdisoPageContent({ adiso }: AdisoPageContentProps) {
  const router = useRouter();

  useEffect(() => {
    // Redirigir a la página principal con el adiso en query param
    // Esto mantiene la compatibilidad con el sistema actual
    router.replace(`/?adiso=${adiso.id}`, { scroll: false });
  }, [adiso.id, router]);

  // Mostrar contenido mientras redirige (mejor para SEO)
  return (
    <div style={{ padding: '2rem', minHeight: '100vh' }}>
      <article>
        <h1>{adiso.titulo}</h1>
        <p>{adiso.descripcion}</p>
        <p><strong>Categoría:</strong> {adiso.categoria}</p>
        <p><strong>Ubicación:</strong> {adiso.ubicacion}</p>
        <p><strong>Publicado:</strong> {adiso.fechaPublicacion} {adiso.horaPublicacion}</p>
        {adiso.imagenesUrls && adiso.imagenesUrls.length > 0 && (
          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {adiso.imagenesUrls.map((url, index) => (
              <div key={index} style={{ position: 'relative', width: '100%', height: '400px' }}>
                <Image
                  src={url}
                  alt={`${adiso.titulo} - Imagen ${index + 1}`}
                  fill
                  sizes="100vw"
                  style={{ objectFit: 'contain' }}
                  loading={index === 0 ? 'eager' : 'lazy'}
                />
              </div>
            ))}
          </div>
        )}
      </article>
    </div>
  );
}

