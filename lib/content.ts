import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import { compileMDX } from 'next-mdx-remote/rsc';
import { SmartLink } from '@/components/SmartLink';
import type { Post, PostType } from '@/lib/types';
import type { TocHeading } from '@/components/TableOfContents';
import { SITE } from '@/lib/site';

const CONTENT_DIR = path.join(process.cwd(), 'content');

export type Frontmatter = {
  title: string;
  description: string;
  canonical?: string;
  lang?: string;
  translationKey?: string;
  date?: string;
  updatedAt?: string;
  robots?: string;
  type?: PostType;
  primaryKeyword?: string;
  jumpLinks?: { href: string; label: string }[];
  quickAnswer?: string[];
  cta?: { title: string; body: string; buttonLabel: string; buttonHref: string };
  internalLinks?: { href: string; anchor: string }[];
  faq?: { q: string; a: string }[];
};

export type DocMeta = {
  segments: string[];
  routePath: string;
  slug: string;
  title: string;
  description: string;
  canonical: string;
  lang?: string;
  translationKey?: string;
  date?: string;
  updatedAt?: string;
  robots?: string;
  type?: PostType;
};

function extractHeadingsFromMdxSource(source: string): TocHeading[] {
  type Match = { index: number; level: number; text: string; explicitId?: string };
  const matches: Match[] = [];

  // Markdown headings (## to ####)
  const mdRe = /^(#{2,4})\s+(.+?)\s*$/gm;
  for (const m of source.matchAll(mdRe)) {
    const level = m[1]?.length ?? 2;
    const text = (m[2] ?? '').replace(/`/g, '').trim();
    if (!text) continue;
    matches.push({ index: m.index ?? 0, level, text });
  }

  // HTML headings (<h2> to <h4>)
  const htmlRe = /<h([2-4])\b([^>]*)>([\s\S]*?)<\/h\1>/gi;
  for (const m of source.matchAll(htmlRe)) {
    const level = Number(m[1] ?? 2);
    const attrs = m[2] ?? '';
    const inner = m[3] ?? '';
    const explicitId = /id\s*=\s*["']([^"']+)["']/i.exec(attrs)?.[1];
    const text = decodeHtmlEntities(stripHtmlTags(inner)).replace(/`/g, '').trim();
    if (!text) continue;
    matches.push({ index: m.index ?? 0, level, text, explicitId });
  }

  matches.sort((a, b) => a.index - b.index);

  const headings: TocHeading[] = [];
  const slugger = createSlugger();

  for (const h of matches) {
    if (h.explicitId) {
      slugger.use(h.explicitId);
      headings.push({ id: h.explicitId, text: h.text, level: h.level });
      continue;
    }
    headings.push({ id: slugger.slug(h.text), text: h.text, level: h.level });
  }

  return headings;
}

function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

type Slugger = { use: (slug: string) => void; slug: (text: string) => string };

function createSlugger(): Slugger {
  const counts = new Map<string, number>();

  function use(slug: string) {
    counts.set(slug, (counts.get(slug) ?? 0) + 1);
  }

  function slug(text: string) {
    const base = slugify(text) || 'section';
    const count = counts.get(base) ?? 0;
    counts.set(base, count + 1);
    return count === 0 ? base : `${base}-${count + 1}`;
  }

  return { use, slug };
}

function stripHtmlTags(input: string): string {
  return input.replace(/<[^>]*>/g, '');
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&#x2f;/gi, '/')
    .replace(/&#(\d+);/g, (_m, n: string) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_m, n: string) => String.fromCharCode(Number.parseInt(n, 16)));
}

function rehypeAddHeadingIds() {
  return (tree: unknown) => {
    const slugger = createSlugger();

    function getText(node: any): string {
      if (!node) return '';
      if (node.type === 'text' && typeof node.value === 'string') return node.value;
      if (!Array.isArray(node.children)) return '';
      return node.children.map(getText).join('');
    }

    function walk(node: any) {
      if (!node) return;

      if (node.type === 'element') {
        node.properties ??= {};
        const existingId = node.properties.id;
        if (existingId) slugger.use(String(existingId));

        const tag = String(node.tagName ?? '').toLowerCase();
        if ((tag === 'h2' || tag === 'h3' || tag === 'h4') && !node.properties.id) {
          const text = getText(node).trim();
          if (text) node.properties.id = slugger.slug(text);
        }
      }

      if (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') {
        const tag = String(node.name ?? '').toLowerCase();
        const attributes = Array.isArray(node.attributes) ? node.attributes : [];
        const existingId = attributes.find((a: any) => a?.type === 'mdxJsxAttribute' && a?.name === 'id')?.value;
        if (typeof existingId === 'string') slugger.use(existingId);

        if ((tag === 'h2' || tag === 'h3' || tag === 'h4') && typeof existingId !== 'string') {
          const text = getText(node).trim();
          if (text) {
            node.attributes ??= [];
            node.attributes.push({ type: 'mdxJsxAttribute', name: 'id', value: slugger.slug(text) });
          }
        }
      }

      if (Array.isArray(node.children)) {
        for (const child of node.children) walk(child);
      }
    }

    walk(tree as any);
  };
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.stat(filePath);
    return true;
  } catch {
    return false;
  }
}

function segmentsToRoutePath(segments: string[]): string {
  return segments.length ? `/${segments.join('/')}` : '/';
}

function segmentsFromMdxRelativePath(relativePath: string): string[] {
  const noExt = relativePath.replace(/\.mdx$/, '');
  const rawSegments = noExt.split(/[/\\]+/).filter(Boolean);
  if (rawSegments.at(-1) === 'index') rawSegments.pop();
  return rawSegments;
}

function stripLangPrefix(segments: string[]): string[] {
  const first = segments[0];
  if (first && (SITE.supportedLangs as readonly string[]).includes(first) && first !== 'en') {
    return segments.slice(1);
  }
  return segments;
}

function inferTypeFromSegments(segments: string[], fm: Frontmatter): PostType | undefined {
  if (fm.type) return fm.type;

  const rest = stripLangPrefix(segments);
  const slug = rest.join('/');
  if (!slug) return 'page';

  const last = rest.at(-1) ?? '';
  if (last === 'blog') return 'blogIndex';
  if (last.startsWith('blog-')) return 'article';
  if (last === 'mentions-legales' || last === 'politique-de-confidentialite' || last === 'legal-notice' || last === 'privacy-policy') {
    return 'legal';
  }

  return 'page';
}

async function listMdxFiles(dir: string): Promise<string[]> {
  const out: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await listMdxFiles(fullPath)));
      continue;
    }
    if (!entry.isFile()) continue;
    if (!entry.name.endsWith('.mdx')) continue;
    if (entry.name.startsWith('_')) continue;
    out.push(fullPath);
  }

  return out.sort();
}

export async function getAllDocMetas(): Promise<DocMeta[]> {
  const files = await listMdxFiles(CONTENT_DIR);
  const items: DocMeta[] = [];

  for (const filePath of files) {
    const relative = path.relative(CONTENT_DIR, filePath).replace(/\\/g, '/');
    const segments = segmentsFromMdxRelativePath(relative);
    const routePath = segmentsToRoutePath(segments);
    const slug = segments.join('/');

    const raw = await fs.readFile(filePath, 'utf8');
    const { data } = matter(raw);
    const fm = data as Frontmatter;

    items.push({
      segments,
      routePath,
      slug,
      title: fm.title,
      description: fm.description,
      canonical: fm.canonical ?? routePath,
      lang: fm.lang,
      translationKey: fm.translationKey,
      date: fm.date,
      updatedAt: fm.updatedAt,
      robots: fm.robots,
      type: inferTypeFromSegments(segments, fm),
    });
  }

  return items;
}

export async function getDocMetaByRouteSegments(segments: string[]): Promise<DocMeta | null> {
  const filePath = await resolveMdxFilePath(segments);
  if (!filePath) return null;

  const relative = path.relative(CONTENT_DIR, filePath).replace(/\\/g, '/');
  const resolvedSegments = segmentsFromMdxRelativePath(relative);
  const routePath = segmentsToRoutePath(resolvedSegments);
  const slug = resolvedSegments.join('/');

  const raw = await fs.readFile(filePath, 'utf8');
  const { data } = matter(raw);
  const fm = data as Frontmatter;

  return {
    segments: resolvedSegments,
    routePath,
    slug,
    title: fm.title,
    description: fm.description,
    canonical: fm.canonical ?? routePath,
    lang: fm.lang,
    translationKey: fm.translationKey,
    date: fm.date,
    updatedAt: fm.updatedAt,
    robots: fm.robots,
    type: inferTypeFromSegments(resolvedSegments, fm),
  };
}

async function resolveMdxFilePath(segments: string[]): Promise<string | null> {
  if (segments.length === 0) {
    const root = path.join(CONTENT_DIR, 'index.mdx');
    return (await exists(root)) ? root : null;
  }

  const direct = path.join(CONTENT_DIR, ...segments) + '.mdx';
  if (await exists(direct)) return direct;

  const asIndex = path.join(CONTENT_DIR, ...segments, 'index.mdx');
  if (await exists(asIndex)) return asIndex;

  return null;
}

export async function getAllStaticParams(): Promise<Array<{ slug: string[] }>> {
  const metas = await getAllDocMetas();
  return metas.map((m) => ({ slug: m.segments }));
}

export async function getPostByRouteSegments(segments: string[]): Promise<Post | null> {
  const filePath = await resolveMdxFilePath(segments);
  if (!filePath) return null;

  const raw = await fs.readFile(filePath, 'utf8');
  const { content: mdxSource, data } = matter(raw);
  const fm = data as Frontmatter;
  const headings = extractHeadingsFromMdxSource(mdxSource);

  // Build-time compilation of trusted local MDX.
  const compiled = await compileMDX({
    source: mdxSource,
    components: {
      a: SmartLink,
    },
    options: {
      parseFrontmatter: false,
      mdxOptions: {
        // @ts-expect-error - options are passed through
        blockDangerousJS: true,
        blockJS: true,
        rehypePlugins: [rehypeAddHeadingIds],
      },
    },
  });

  const slug = segments.join('/');

  return {
    slug,
    title: fm.title,
    description: fm.description,
    date: fm.date,
    updatedAt: fm.updatedAt,
    canonical: fm.canonical,
    type: inferTypeFromSegments(segments, fm),
    lang: fm.lang,
    translationKey: fm.translationKey,
    robots: fm.robots,
    primaryKeyword: fm.primaryKeyword,
    jumpLinks: fm.jumpLinks,
    quickAnswer: fm.quickAnswer,
    cta: fm.cta,
    internalLinks: fm.internalLinks,
    faq: fm.faq,
    headings,
    content: compiled.content,
  };
}
