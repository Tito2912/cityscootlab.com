import type { Metadata, Viewport } from 'next';
import './globals.css';
import { SITE } from '@/lib/site';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { CookieBanner } from '@/components/CookieBanner';
import { LangHtmlUpdater } from '@/components/LangHtmlUpdater';
import { FaqEnhancer } from '@/components/FaqEnhancer';
import { BlogSearchEnhancer } from '@/components/BlogSearchEnhancer';

export const viewport: Viewport = {
  themeColor: '#2563eb',
};

export const metadata: Metadata = {
  title: {
    default: SITE.brandName,
    template: `%s | ${SITE.brandName}`,
  },
  description:
    'isinwheel scooter deals, reviews and commuter guides: coupon ISW50 tips, top picks, comparisons, and practical buying advice.',
  metadataBase: new URL(SITE.baseUrl),
  alternates: { canonical: '/' },
  other: { 'verify-admitad': '2e25bfb20e' },
  icons: {
    icon: [
      { url: '/images/favicon.ico', type: 'image/x-icon' },
      { url: '/images/cityscootlab-favicon.svg', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/images/cityscootlab-icon-180.png', type: 'image/png' }],
  },
  manifest: '/images/site.webmanifest',
  openGraph: {
    type: 'website',
    title: SITE.brandName,
    description:
      'isinwheel scooter deals, reviews and commuter guides: top picks, comparisons, and buying advice.',
    url: SITE.baseUrl,
    images: [{ url: '/images/og-cityscootlab.jpg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE.brandName,
    description:
      'isinwheel scooter deals, reviews and commuter guides: top picks, comparisons, and buying advice.',
    images: ['/images/og-cityscootlab.jpg'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
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
