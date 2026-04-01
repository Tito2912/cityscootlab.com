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
    'Offres, avis et guides de trottinettes isinwheel : code ISW50, top picks, comparatifs et conseils d’achat.',
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
    description: 'Offres, avis et guides de trottinettes isinwheel : top picks, comparatifs et conseils d’achat.',
    url: SITE.baseUrl,
    images: [{ url: '/images/og-cityscootlab.jpg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE.brandName,
    description: 'Offres, avis et guides de trottinettes isinwheel : top picks, comparatifs et conseils d’achat.',
    images: ['/images/og-cityscootlab.jpg'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body>
        <SiteJsonLd lang="fr" />
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

