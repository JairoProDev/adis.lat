import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://adis.lat';

const categorias = ['empleos', 'inmuebles', 'vehiculos', 'servicios', 'productos', 'eventos', 'negocios', 'comunidad'] as const;

async function getPublicData() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { adisos: [], businesses: [] };
  }
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const [adisosRes, businessRes] = await Promise.allSettled([
    client.from('adisos').select('id, categoria, fechaPublicacion').order('fechaPublicacion', { ascending: false }).limit(5000),
    client.from('business_profiles').select('slug, updated_at').eq('is_published', true).limit(1000),
  ]);
  return {
    adisos: adisosRes.status === 'fulfilled' ? (adisosRes.value.data || []) : [],
    businesses: businessRes.status === 'fulfilled' ? (businessRes.value.data || []) : [],
  };
}

function safeDate(val: any): Date {
  try {
    if (!val) return new Date();
    const d = new Date(val);
    return isNaN(d.getTime()) ? new Date() : d;
  } catch { return new Date(); }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { adisos, businesses } = await getPublicData();

  const staticPages: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: new Date(), changeFrequency: 'hourly', priority: 1 },
    { url: `${siteUrl}/publicar`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${siteUrl}/mapa`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.6 },
    { url: `${siteUrl}/chat`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${siteUrl}/feed`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
  ];

  const categoriaPages: MetadataRoute.Sitemap = categorias.flatMap((cat) => [
    { url: `${siteUrl}/categoria/${cat}`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.85 },
    { url: `${siteUrl}/?categoria=${cat}`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.7 },
  ]);

  const businessPages: MetadataRoute.Sitemap = (businesses as any[]).map((biz) => ({
    url: `${siteUrl}/negocio/${biz.slug}`,
    lastModified: safeDate(biz.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const adisoPages: MetadataRoute.Sitemap = (adisos as any[]).slice(0, 5000).map((adiso) => ({
    url: `${siteUrl}/${adiso.categoria}/${adiso.id}`,
    lastModified: safeDate(adiso.fechaPublicacion),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  return [...staticPages, ...categoriaPages, ...businessPages, ...adisoPages];
}
