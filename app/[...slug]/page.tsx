import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getAdisoByIdFromSupabase } from '@/lib/supabase';
import { getBusinessProductAsAdiso } from '@/lib/business';
import { getIdFromSlug } from '@/lib/url';
import ClientAdisoWrapper from '@/components/ClientAdisoWrapper';
import { Categoria, Adiso } from '@/types';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://buscadis.com';

interface PageProps {
    params: Promise<{
        slug: string[]; // Catch-all array
    }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;

    // Format 1: /[ubicacion]/[categoria]/[slug] (Length 3)
    // Format 2: /[categoria]/[id] (Length 2) - Legacy

    if (slug.length === 3) {
        const [ubicacion, categoria, adSlug] = slug;
        const id = getIdFromSlug(adSlug);
        if (!id) return { title: 'Adiso no encontrado' };

        try {
            let adiso = await getAdisoByIdFromSupabase(id);
            if (!adiso) {
                adiso = await getBusinessProductAsAdiso(id);
            }

            if (!adiso) return { title: 'Adiso no encontrado' };

            const title = `${adiso.titulo} en ${ubicacion} | Buscadis`;
            const description = adiso.descripcion
                ? `${adiso.descripcion.substring(0, 160)}...`
                : `Anuncio de ${adiso.categoria}: ${adiso.titulo}`;
            const url = `${siteUrl}/${ubicacion}/${categoria}/${adSlug}`;
            const imageUrl = adiso.imagenesUrls?.[0] || adiso.imagenUrl || `${siteUrl}/og-image.jpg`;

            return {
                title,
                description,
                alternates: { canonical: url },
                openGraph: {
                    title, description, url, siteName: 'Buscadis',
                    images: [{ url: imageUrl, width: 1200, height: 630, alt: adiso.titulo }],
                    locale: 'es_PE', type: 'article'
                },
                twitter: { card: 'summary_large_image', title, description, images: [imageUrl] }
            };
        } catch (e) { return { title: 'Error' }; }

    } else if (slug.length === 2) {
        const [categoria, id] = slug;

        // Check if category is valid or 'adiso' (special route for catalog products)
        const categoriasValidas: string[] = ['empleos', 'inmuebles', 'vehiculos', 'servicios', 'productos', 'eventos', 'negocios', 'comunidad', 'adiso'];
        if (!categoriasValidas.includes(categoria)) return { title: 'No encontrado' };

        try {
            let adiso = await getAdisoByIdFromSupabase(id);
            if (!adiso) {
                adiso = await getBusinessProductAsAdiso(id);
            }

            if (!adiso) return { title: 'Adiso no encontrado' };

            const title = `${adiso.titulo} - ${adiso.categoria} | Buscadis`;
            const url = `${siteUrl}/${categoria}/${id}`;
            const imageUrl = adiso.imagenesUrls?.[0] || adiso.imagenUrl || `${siteUrl}/og-image.jpg`;

            return {
                title,
                // ... minimal metadata for legacy
                alternates: { canonical: url },
                openGraph: {
                    title,
                    url,
                    images: [{ url: imageUrl }]
                }
            };
        } catch (e) { return { title: 'Error' }; }
    }

    return { title: 'Buscadis' };
}

export default async function Page({ params }: PageProps) {
    const { slug } = await params;

    let targetId: string | null = null;
    let isLegacy = false;

    if (slug.length === 3) {
        // New SEO URL: /[ubicacion]/[categoria]/[slug]
        targetId = getIdFromSlug(slug[2]);
    } else if (slug.length === 2) {
        // Legacy URL: /[categoria]/[id]
        // Basic check if 2nd param looks like an ID
        targetId = slug[1];
        isLegacy = true;
    }

    if (!targetId) return notFound();

    // Try Server Fetch
    let adiso: Adiso | null = null;
    try {
        adiso = await getAdisoByIdFromSupabase(targetId);
        if (!adiso) {
            // Try fetching from catalog_products if not found in adisos
            adiso = await getBusinessProductAsAdiso(targetId);
        }
    } catch (err) {
        console.error('Error fetching adiso:', err);
    }

    // Render Wrapper
    // Wrapper handles "loading..." or "storage fallback" if server adiso is null
    return <ClientAdisoWrapper id={targetId} initialAdiso={adiso} />;
}

