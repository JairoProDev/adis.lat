import type { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';

interface LayoutProps {
    children: React.ReactNode;
    params: Promise<{ slug: string }>;
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://adis.lat';

async function getBusinessBySlug(slug: string) {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null;
    try {
        const client = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );
        const { data } = await client
            .from('business_profiles')
            .select('name, description, logo_url, cover_image_url, city, address, contact_whatsapp, category, tags')
            .eq('slug', slug)
            .eq('is_published', true)
            .maybeSingle();
        return data;
    } catch { return null; }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const business = await getBusinessBySlug(slug);

    if (!business) {
        return {
            title: 'Negocio no encontrado | Adis.lat',
            robots: { index: false, follow: false },
        };
    }

    const title = `${business.name} | Adis.lat`;
    const description = business.description
        ? `${business.description.substring(0, 155)}`
        : `Visita el catálogo y contacta a ${business.name} en Adis.lat. ${business.city ? `Ubicado en ${business.city}.` : ''} Haz tu pedido por WhatsApp.`;

    const url = `${siteUrl}/negocio/${slug}`;
    const imageUrl = business.logo_url || business.cover_image_url || `${siteUrl}/og-image.jpg`;

    const keywords = [
        business.name,
        business.category,
        business.city,
        'catálogo online',
        'Perú',
        'pedir por WhatsApp',
        'Adis.lat',
        ...(business.tags || []),
    ].filter(Boolean).join(', ');

    return {
        title,
        description,
        keywords,
        alternates: { canonical: url },
        openGraph: {
            title,
            description,
            url,
            siteName: 'Adis.lat',
            type: 'website',
            locale: 'es_PE',
            images: [
                {
                    url: imageUrl,
                    width: 1200,
                    height: 630,
                    alt: `${business.name} - Catálogo en Adis.lat`,
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [imageUrl],
        },
        robots: {
            index: true,
            follow: true,
            googleBot: {
                index: true,
                follow: true,
                'max-image-preview': 'large',
                'max-snippet': -1,
            },
        },
    };
}

export default function NegocioLayout({ children }: LayoutProps) {
    return <>{children}</>;
}
