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
    'comunidad',
  ];

  // Páginas estáticas
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1,
    },
    {
      url: `${siteUrl}/progreso`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
  ];

  // Páginas de categorías
  const categoriaPages: MetadataRoute.Sitemap = categorias.map((categoria) => ({
    url: `${siteUrl}/?categoria=${categoria}`,
    lastModified: new Date(),
    changeFrequency: 'hourly',
    priority: 0.8,
  }));

  // Páginas de adisos individuales
  let adisoPages: MetadataRoute.Sitemap = [];
  try {
    const adisos = await getAdisosFromSupabase();
    adisoPages = adisos.map((adiso) => ({
      url: `${siteUrl}/${adiso.categoria}/${adiso.id}`,
      lastModified: new Date(`${adiso.fechaPublicacion}T${adiso.horaPublicacion}:00`),
      changeFrequency: 'daily',
      priority: 0.7,
    }));
  } catch (error) {
    console.error('Error al generar sitemap de adisos:', error);
  }

  return [...staticPages, ...categoriaPages, ...adisoPages];
}

