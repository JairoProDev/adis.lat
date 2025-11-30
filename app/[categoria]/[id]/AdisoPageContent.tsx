'use client';

import { useEffect } from 'react';
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
          <div>
            {adiso.imagenesUrls.map((url, index) => (
              <img key={index} src={url} alt={`${adiso.titulo} - Imagen ${index + 1}`} style={{ maxWidth: '100%', marginTop: '1rem' }} />
            ))}
          </div>
        )}
      </article>
    </div>
  );
}

