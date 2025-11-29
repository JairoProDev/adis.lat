import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Buscadis - Avisos Clasificados',
  description: 'Publica y encuentra avisos clasificados',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}

