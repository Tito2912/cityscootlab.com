import Link from 'next/link';
import { TableOfContents } from '@/components/TableOfContents';
import { FAQ } from '@/components/FAQ';
import { CTABox } from '@/components/CTABox';
import type { Post } from '@/lib/types';
import { normalizeLang, UI_TRANSLATIONS } from '@/lib/site';

export function ArticleLayout({ post }: { post: Post }) {
  const showToc = post.type === 'article' && post.headings.length > 0;
  const lang = normalizeLang(post.lang);
  const t = UI_TRANSLATIONS[lang];

  return (
    <article className="article stack">
      <div className={`grid${showToc ? ' with-toc' : ''}`}>
        <div className="stack">
          {/* Jump links (optional): helps scanning long guides */}
          {post.jumpLinks?.length ? (
            <section className="card" aria-label="Aller à">
              <strong>{t.jumpTo}</strong>
              <ul className="list">
                {post.jumpLinks.map((j) => (
                  <li key={j.href}>
                    <a href={j.href}>{j.label}</a>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* Quick answer block: visible fast */}
          {post.quickAnswer?.length ? (
            <section className="card" aria-label="Quick answer">
              <strong>{t.quickAnswer}</strong>
              <ul className="list">
                {post.quickAnswer.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* MDX content */}
          <div className="stack">{post.content}</div>

          {/* CTA */}
          {post.cta ? (
            <CTABox title={post.cta.title} body={post.cta.body} buttonLabel={post.cta.buttonLabel} buttonHref={post.cta.buttonHref} />
          ) : null}

          {post.cta ? <hr className="hr" /> : null}

          {/* FAQ */}
          {post.faq?.length ? <FAQ items={post.faq} /> : null}

          {/* Next steps */}
          {post.internalLinks?.length ? (
            <section className="card">
              <h2 id="next-steps">{t.nextSteps}</h2>
              <ul className="list">
                {post.internalLinks.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href}>{l.anchor}</Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        {showToc ? (
          <aside className="toc" aria-label="Table of contents">
            <div className="card">
              <strong>{t.onThisPage}</strong>
              <TableOfContents headings={post.headings} />
            </div>
          </aside>
        ) : null}
      </div>
    </article>
  );
}
