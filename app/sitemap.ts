import { MetadataRoute } from 'next';
import { getAdisosFromSupabase } from '@/lib/supabase';
import { Categoria } from '@/types';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://buscadis.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const categorias: Categoria[] = [
    'empleos',
    'inmuebles',
    'vehiculos',
    'servicios',
    'productos',
    'eventos',
    'negocios',
    'comunidad'
  ];

  // Páginas estáticas
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1,
    },
  ];

  // Páginas de categorías (tanto query param como ruta dedicada)
  const categoriaPages: MetadataRoute.Sitemap = categorias.flatMap((categoria) => [
    {
      url: `${siteUrl}/?categoria=${categoria}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
    {
      url: `${siteUrl}/categoria/${categoria}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    },
  ]);

  // Páginas de adisos
  let adisoPages: MetadataRoute.Sitemap = [];
  
  try {
    const adisos = await getAdisosFromSupabase();
    
    adisoPages = adisos.slice(0, 1000).map((adiso) => ({
      url: `${siteUrl}/${adiso.categoria}/${adiso.id}`,
      lastModified: new Date(`${adiso.fechaPublicacion}T${adiso.horaPublicacion}:00`),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));
  } catch (error) {
    console.error('Error al generar sitemap de adisos:', error);
    // Continuar sin adisos si hay error
  }

  return [...staticPages, ...categoriaPages, ...adisoPages];
}
