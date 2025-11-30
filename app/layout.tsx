import type { Metadata } from 'next';
import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://buscadis.com';

export const metadata: Metadata = {
  title: {
    default: 'Buscadis - Adisos Clasificados',
    template: '%s | Buscadis',
  },
  description: 'Publica y encuentra adisos clasificados en Perú. Empleos, inmuebles, vehículos, servicios, productos, eventos, negocios y más.',
  keywords: ['clasificados', 'avisos', 'empleos', 'inmuebles', 'vehículos', 'servicios', 'productos', 'eventos', 'negocios', 'Perú', 'Cusco'],
  authors: [{ name: 'Buscadis' }],
  creator: 'Buscadis',
  publisher: 'Buscadis',
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'es_PE',
    url: siteUrl,
    siteName: 'Buscadis',
    title: 'Buscadis - Adisos Clasificados',
    description: 'Publica y encuentra adisos clasificados en Perú',
    images: [
      {
        url: `${siteUrl}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'Buscadis - Adisos Clasificados',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Buscadis - Adisos Clasificados',
    description: 'Publica y encuentra adisos clasificados en Perú',
    images: [`${siteUrl}/og-image.jpg`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Agregar cuando tengas Google Search Console
    // google: 'verification-code',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link rel="canonical" href={siteUrl} />
      </head>
      <body>{children}</body>
    </html>
  );
}

