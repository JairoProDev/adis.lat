'use client';

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Categoria } from '@/types';

export default function AdisoPage() {
  const router = useRouter();
  const params = useParams();
  const categoria = params?.categoria as string;
  const id = params?.id as string;

  useEffect(() => {
    // Redirigir inmediatamente sin mostrar nada
    if (categoria && id) {
      // Validar que la categoría sea válida
      const categoriasValidas: Categoria[] = ['empleos', 'inmuebles', 'vehiculos', 'servicios', 'productos', 'eventos', 'negocios', 'comunidad'];
      if (categoriasValidas.includes(categoria as Categoria)) {
        // Redirigir a la página principal con el adiso en query param
        router.replace(`/?adiso=${id}`, { scroll: false });
      } else {
        router.replace('/', { scroll: false });
      }
    } else {
      router.replace('/', { scroll: false });
    }
  }, [categoria, id, router]);

  // No mostrar nada, redirección instantánea
  return null;
}

