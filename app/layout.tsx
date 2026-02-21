import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthProvider } from '@/contexts/AuthContext';
import { AdisosGratuitosCacheProvider } from '@/contexts/AdisosGratuitosCache';
import { defaultLocale } from '@/i18n';
import MotionProvider from '@/components/MotionProvider';
import { NavigationProvider } from '@/contexts/NavigationContext';
import { UIProvider } from '@/contexts/UIContext';
import { FavoritosProvider } from '@/contexts/FavoritosContext';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://adis.lat';
const siteName = 'Adis.lat';
const siteTitle = 'Adis.lat — Clasificados y Catálogos en Perú';
const siteDescription = 'Publica y encuentra clasificados en Perú: empleos, inmuebles, vehículos, servicios, productos y más. Crea tu catálogo online con IA y recibe pedidos por WhatsApp.';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#3c6997',
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  keywords: [
    'clasificados Perú', 'avisos clasificados', 'empleos Peru', 'inmuebles Peru',
    'vehículos usados Perú', 'servicios Cusco', 'compra venta Peru',
    'catálogo online negocio', 'pedidos por WhatsApp', 'marketplace Peru',
    'anuncios gratis Peru', 'adis.lat', 'buscadis',
  ],
  authors: [{ name: siteName, url: siteUrl }],
  creator: siteName,
  publisher: siteName,
  category: 'marketplace',
  alternates: {
    canonical: '/',
    languages: { 'es-PE': '/' },
  },
  openGraph: {
    type: 'website',
    locale: 'es_PE',
    url: siteUrl,
    siteName,
    title: siteTitle,
    description: siteDescription,
    images: [
      {
        url: `${siteUrl}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: `${siteName} — Clasificados y Catálogos en Perú`,
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@adislat',
    title: siteTitle,
    description: siteDescription,
    images: [`${siteUrl}/og-image.jpg`],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icon-512.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
    shortcut: '/favicon.ico',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: siteName,
  },
};

// ── Structured Data (Organization + WebSite) ─────────────────────────────────

const structuredDataOrg = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: siteName,
  url: siteUrl,
  logo: `${siteUrl}/icon-512.png`,
  sameAs: [
    'https://www.facebook.com/adislat',
    'https://www.instagram.com/adislat',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer service',
    areaServed: 'PE',
    availableLanguage: 'Spanish',
  },
};

const structuredDataWebsite = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: siteName,
  url: siteUrl,
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${siteUrl}/?buscar={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
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
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredDataOrg) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredDataWebsite) }}
        />
        {/* Preconnects for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Theme detection script (must be synchronous to prevent FOUC) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme')||'auto',r=document.documentElement;if(t==='dark'){r.classList.add('dark-mode')}else if(t==='light'){r.classList.add('light-mode')}else{if(window.matchMedia('(prefers-color-scheme: dark)').matches){r.classList.add('dark-mode')}else{r.classList.add('light-mode')}}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <ErrorBoundary>
          <MotionProvider>
            <AuthProvider>
              <FavoritosProvider>
                <UIProvider>
                  <AdisosGratuitosCacheProvider>
                    <NavigationProvider>
                      {children}
                    </NavigationProvider>
                  </AdisosGratuitosCacheProvider>
                </UIProvider>
              </FavoritosProvider>
            </AuthProvider>
          </MotionProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
