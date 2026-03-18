import type { Post } from '@/lib/types';
import { homePath, normalizeLang, SITE } from '@/lib/site';

const BASE_URL = SITE.baseUrl;
const HOME_LABEL: Record<string, string> = {
  fr: 'Accueil',
  en: 'Home',
  es: 'Inicio',
  de: 'Startseite',
};

export function buildArticleJsonLd(post: Post) {
  const url = new URL(post.canonical ?? `/${post.slug}`, BASE_URL).toString();
  const published = post.date ?? post.updatedAt ?? new Date().toISOString();
  const modified = post.updatedAt ?? published;

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    mainEntityOfPage: url,
    datePublished: published,
    dateModified: modified,
    author: [{ '@type': 'Organization', name: SITE.brandName }],
    publisher: { '@type': 'Organization', name: SITE.brandName },
  };
}

export function buildBreadcrumbJsonLd(post: Post) {
  const lang = normalizeLang(post.lang);
  const homeUrl = new URL(homePath(lang), BASE_URL).toString();
  const url = new URL(post.canonical ?? `/${post.slug}`, BASE_URL).toString();
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: HOME_LABEL[lang] ?? 'Home',
        item: homeUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: post.title,
        item: url,
      },
    ],
  };
}
