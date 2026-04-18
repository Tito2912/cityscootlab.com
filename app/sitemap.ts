import type { MetadataRoute } from 'next';
import { getAllDocMetas, type DocMeta } from '@/lib/content';
import { buildAlternates } from '@/lib/seo';
import { SITE } from '@/lib/site';

export const dynamic = 'force-static';

function isNoindex(robots: string | undefined): boolean {
  return (robots ?? '').toLowerCase().includes('noindex');
}

function absoluteUrl(pathOrUrl: string): string {
  return new URL(pathOrUrl, SITE.baseUrl).toString();
}

function buildSitemapAlternates(meta: DocMeta, all: DocMeta[]): MetadataRoute.Sitemap[number]['alternates'] | undefined {
  const alternates = (buildAlternates(meta, all) ?? {}).languages;
  if (!alternates || !Object.keys(alternates).length) return undefined;

  const languages: Record<string, string> = {};
  for (const [lang, href] of Object.entries(alternates)) {
    if (typeof href === 'string') {
      languages[lang] = absoluteUrl(href);
      continue;
    }
    if (href instanceof URL) {
      languages[lang] = href.toString();
      continue;
    }
    if (Array.isArray(href) && typeof href[0]?.url === 'string') {
      languages[lang] = absoluteUrl(href[0].url);
    }
  }

  return { languages };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const metas = await getAllDocMetas();
  const now = new Date().toISOString();

  return metas
    .filter((m) => !isNoindex(m.robots))
    .map((m) => ({
      url: absoluteUrl(m.canonical ?? m.routePath),
      lastModified: m.updatedAt ?? m.date ?? now,
      alternates: buildSitemapAlternates(m, metas),
    }));
}
