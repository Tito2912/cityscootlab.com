import type { Metadata } from 'next';
import type { DocMeta } from '@/lib/content';

export function parseRobots(robots: string | undefined): Metadata['robots'] | undefined {
  if (!robots) return undefined;
  const r = robots.toLowerCase();
  return {
    index: !r.includes('noindex'),
    follow: !r.includes('nofollow'),
  };
}

export function buildAlternates(meta: DocMeta, all: DocMeta[]): Metadata['alternates'] {
  const canonical = meta.canonical ?? meta.routePath;

  if (!meta.translationKey) {
    return { canonical };
  }

  const languages: Record<string, string> = {};
  for (const m of all) {
    if (m.translationKey !== meta.translationKey) continue;
    if (!m.lang) continue;
    languages[m.lang] = m.canonical ?? m.routePath;
  }

  if (languages.en && !languages['x-default']) {
    languages['x-default'] = languages.en;
  }

  return {
    canonical,
    languages: Object.keys(languages).length ? languages : undefined,
  };
}

export function getOpenGraphType(meta: DocMeta): 'website' | 'article' {
  if (!meta.translationKey) return 'website';
  if (meta.translationKey === 'home') return 'website';
  if (meta.translationKey === 'blog_index') return 'website';
  return 'article';
}

export function getOpenGraphImage(meta: DocMeta): string {
  // Single OG image for the whole site (keeps branding consistent).
  void meta;
  return '/images/og-cityscootlab.jpg';
}
