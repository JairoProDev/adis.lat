import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getAdisoByIdFromSupabase } from '@/lib/supabase';
import { getIdFromSlug } from '@/lib/url';
import AdisoPageContent from '@/app/[categoria]/[id]/AdisoPageContent';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://buscadis.com';

interface PageProps {
    params: Promise<{
        ubicacion: string;
        categoria: string;
        slug: string;
    }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { ubicacion, categoria, slug } = await params;
    const id = getIdFromSlug(slug);

    if (!id) {
        return { title: 'Adiso no encontrado' };
    }

    try {
        const adiso = await getAdisoByIdFromSupabase(id);

        if (!adiso) {
            return { title: 'Adiso no encontrado' };
        }

        const title = `${adiso.titulo} en ${ubicacion} | Buscadis`;
        const description = adiso.descripcion
            ? `${adiso.descripcion.substring(0, 160)}...`
            : `Anuncio de ${adiso.categoria}: ${adiso.titulo}`;
        const url = `${siteUrl}/${ubicacion}/${categoria}/${slug}`;
        const imageUrl = adiso.imagenesUrls?.[0] || adiso.imagenUrl || `${siteUrl}/og-image.jpg`;

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
                images: [{ url: imageUrl, width: 1200, height: 630, alt: adiso.titulo }],
                locale: 'es_PE',
                type: 'article',
            },
            twitter: {
                card: 'summary_large_image',
                title,
                description,
                images: [imageUrl],
            },
        };
    } catch (error) {
        console.error('Error metadata:', error);
        return { title: 'Error' };
    }
}

export default async function Page({ params }: PageProps) {
    const { ubicacion, categoria, slug } = await params;
    const id = getIdFromSlug(slug);

    if (!id) notFound();

    try {
        const adiso = await getAdisoByIdFromSupabase(id);
        if (!adiso) notFound();

        return <AdisoPageContent adiso={adiso} />;
    } catch (error) {
        console.error('Error page:', error);
        notFound();
    }
}
