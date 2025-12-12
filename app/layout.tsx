import type { Metadata } from 'next';
import './globals.css';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthProvider } from '@/contexts/AuthContext';
import { AdisosGratuitosCacheProvider } from '@/contexts/AdisosGratuitosCache';
import { defaultLocale } from '@/i18n';
import MotionProvider from '@/components/MotionProvider';
import FloatingChatbot from '@/components/FloatingChatbot';
import { NavigationProvider } from '@/contexts/NavigationContext';

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
    <html lang={defaultLocale} suppressHydrationWarning>
      <head>
        <link rel="canonical" href={siteUrl} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#3c6997" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme') || 'auto';
                  const root = document.documentElement;
                  if (theme === 'dark') {
                    root.classList.add('dark-mode');
                  } else if (theme === 'light') {
                    root.classList.add('light-mode');
                  } else {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    if (prefersDark) {
                      root.classList.add('dark-mode');
                    } else {
                      root.classList.add('light-mode');
                    }
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <ErrorBoundary>
          <MotionProvider>
            <AuthProvider>
              <AdisosGratuitosCacheProvider>
                <NavigationProvider>
                  {children}
                  <FloatingChatbot />
                </NavigationProvider>
              </AdisosGratuitosCacheProvider>
            </AuthProvider>
          </MotionProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}

