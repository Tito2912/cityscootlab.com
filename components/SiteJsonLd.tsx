import type { Lang } from '@/lib/site';
import { SITE } from '@/lib/site';

export function SiteJsonLd({ lang }: { lang: Lang }) {
  const baseUrl = SITE.baseUrl;
  const organizationId = `${baseUrl}#organization`;
  const websiteId = `${baseUrl}#website`;

  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': organizationId,
    name: SITE.brandName,
    url: baseUrl,
    logo: {
      '@type': 'ImageObject',
      url: new URL('/images/cityscootlab-logo.png', baseUrl).toString(),
    },
  };

  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': websiteId,
    url: baseUrl,
    name: SITE.brandName,
    alternateName: SITE.domain,
    publisher: { '@id': organizationId },
    inLanguage: lang,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }} />
    </>
  );
}

