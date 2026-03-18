import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArticleLayout } from '@/components/ArticleLayout';
import { getAllDocMetas, getAllStaticParams, getDocMetaByRouteSegments, getPostByRouteSegments } from '@/lib/content';
import { buildArticleJsonLd, buildBreadcrumbJsonLd } from '@/lib/schema';
import { buildAlternates, getOpenGraphImage, getOpenGraphType, parseRobots } from '@/lib/seo';

export async function generateStaticParams() {
  const all = await getAllStaticParams();
  return all.filter((x) => x.slug.length > 0);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
  const { slug } = await params;
  const meta = await getDocMetaByRouteSegments(slug);
  if (!meta) return {};

  const all = await getAllDocMetas();
  const ogImage = getOpenGraphImage(meta);
  const canonical = meta.canonical ?? meta.routePath;

  return {
    title: meta.title,
    description: meta.description,
    alternates: buildAlternates(meta, all),
    robots: parseRobots(meta.robots),
    openGraph: {
      type: getOpenGraphType(meta),
      title: meta.title,
      description: meta.description,
      url: canonical,
      images: [{ url: ogImage }],
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.title,
      description: meta.description,
      images: [ogImage],
    },
  };
}

export default async function CatchAllPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const post = await getPostByRouteSegments(slug);
  if (!post) return notFound();

  const articleJsonLd = buildArticleJsonLd(post);
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(post);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {post.faq?.length ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: post.faq.map((x) => ({
                '@type': 'Question',
                name: x.q,
                acceptedAnswer: { '@type': 'Answer', text: x.a },
              })),
            }),
          }}
        />
      ) : null}

      <ArticleLayout post={post} />
    </>
  );
}

