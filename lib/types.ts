import type { ReactNode } from 'react';
import type { TocHeading } from '@/components/TableOfContents';

export type PostType = 'page' | 'article' | 'legal' | 'blogIndex';

export type Post = {
  slug: string;
  title: string;
  description: string;
  date?: string;
  updatedAt?: string;
  canonical?: string;
  type?: PostType;
  primaryKeyword?: string;
  jumpLinks?: { href: string; label: string }[];
  quickAnswer?: string[];
  cta?: { title: string; body: string; buttonLabel: string; buttonHref: string };
  internalLinks?: { href: string; anchor: string }[];
  faq?: { q: string; a: string }[];
  lang?: string;
  translationKey?: string;
  robots?: string;
  headings: TocHeading[];
  content: ReactNode;
};
