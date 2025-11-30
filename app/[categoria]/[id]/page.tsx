import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getAdisoByIdFromSupabase } from '@/lib/supabase';
import { Categoria } from '@/types';
import AdisoPageContent from './AdisoPageContent';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://buscadis.com';

interface PageProps {
  params: Promise<{
    categoria: string;
    id: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { categoria, id } = await params;
  
  // Validar categoría
  const categoriasValidas: Categoria[] = ['empleos', 'inmuebles', 'vehiculos', 'servicios', 'productos', 'eventos', 'negocios', 'comunidad'];
  if (!categoriasValidas.includes(categoria as Categoria)) {
    return {
      title: 'Adiso no encontrado',
    };
  }

  try {
    const adiso = await getAdisoByIdFromSupabase(id);
    
    if (!adiso) {
      return {
        title: 'Adiso no encontrado',
      };
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

    const categoriaLabel = categoriaLabels[adiso.categoria];
    const title = `${adiso.titulo} - ${categoriaLabel} | Buscadis`;
    const description = adiso.descripcion 
      ? `${adiso.descripcion.substring(0, 160)}...`
      : `Adiso de ${categoriaLabel}: ${adiso.titulo}`;
    const url = `${siteUrl}/${categoria}/${id}`;
    const imageUrl = adiso.imagenesUrls?.[0] || adiso.imagenUrl || `${siteUrl}/og-image.jpg`;

    // Structured data según tipo de categoría
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': adiso.categoria === 'empleos' ? 'JobPosting' : 'Product',
      name: adiso.titulo,
      description: adiso.descripcion,
      ...(adiso.categoria === 'empleos' ? {
        employmentType: 'FULL_TIME',
        jobLocation: {
          '@type': 'Place',
          address: {
            '@type': 'PostalAddress',
            addressLocality: adiso.ubicacion,
          },
        },
      } : {
        category: categoriaLabel,
        offers: {
          '@type': 'Offer',
          availability: 'https://schema.org/InStock',
        },
      }),
      image: imageUrl,
      datePublished: `${adiso.fechaPublicacion}T${adiso.horaPublicacion}:00`,
    };

    return {
      title,
      description,
      alternates: {
        canonical: url,
      },
      openGraph: {
        title,
        description,
        url,
        siteName: 'Buscadis',
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: adiso.titulo,
          },
        ],
        locale: 'es_PE',
        type: 'article',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [imageUrl],
      },
      other: {
        'application/ld+json': JSON.stringify(structuredData),
      },
    };
  } catch (error) {
    console.error('Error al generar metadata:', error);
    return {
      title: 'Error al cargar adiso',
    };
  }
}

export default async function AdisoPage({ params }: PageProps) {
  const { categoria, id } = await params;
  
  // Validar categoría
  const categoriasValidas: Categoria[] = ['empleos', 'inmuebles', 'vehiculos', 'servicios', 'productos', 'eventos', 'negocios', 'comunidad'];
  if (!categoriasValidas.includes(categoria as Categoria)) {
    notFound();
  }

  try {
    const adiso = await getAdisoByIdFromSupabase(id);
    
    if (!adiso) {
      notFound();
    }

    // Si la categoría en la URL no coincide con la del adiso, redirigir
    if (adiso.categoria !== categoria) {
      redirect(`/${adiso.categoria}/${id}`);
    }

    return <AdisoPageContent adiso={adiso} />;
  } catch (error) {
    console.error('Error al cargar adiso:', error);
    notFound();
  }
}
