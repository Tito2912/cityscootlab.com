import type { Metadata, Viewport } from 'next';
import '../globals.css';
import { SITE } from '@/lib/site';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { CookieBanner } from '@/components/CookieBanner';
import { LangHtmlUpdater } from '@/components/LangHtmlUpdater';
import { FaqEnhancer } from '@/components/FaqEnhancer';
import { BlogSearchEnhancer } from '@/components/BlogSearchEnhancer';
import { SiteJsonLd } from '@/components/SiteJsonLd';

export const viewport: Viewport = {
  themeColor: '#2563eb',
};

export const metadata: Metadata = {
  title: {
    default: SITE.brandName,
    template: '%s',
  },
  description:
    'Ofertas y reseñas de scooters isinwheel: cupón ISW50, selecciones, comparativas y consejos de compra.',
  metadataBase: new URL(SITE.baseUrl),
  other: { 'verify-admitad': '2e25bfb20e' },
  icons: {
    icon: [
      { url: '/favicon.ico', type: 'image/x-icon' },
      { url: '/favicon.png', type: 'image/png', sizes: '96x96' },
      { url: '/images/cityscootlab-favicon.svg', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/apple-touch-icon.png', type: 'image/png', sizes: '180x180' }],
  },
  manifest: '/images/site.webmanifest',
  openGraph: {
    type: 'website',
    title: SITE.brandName,
    description: 'Ofertas y reseñas de scooters isinwheel: selecciones, comparativas y consejos de compra.',
    url: SITE.baseUrl,
    images: [{ url: '/images/og-cityscootlab.jpg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE.brandName,
    description: 'Ofertas y reseñas de scooters isinwheel: selecciones, comparativas y consejos de compra.',
    images: ['/images/og-cityscootlab.jpg'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <SiteJsonLd lang="es" />
        <LangHtmlUpdater />
        <FaqEnhancer />
        <BlogSearchEnhancer />
        <SiteHeader />
        <main className="container">{children}</main>
        <SiteFooter />
        <CookieBanner />
      </body>
    </html>
  );
}

