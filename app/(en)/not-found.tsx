import Link from 'next/link';
import { SITE } from '@/lib/site';

export default function NotFoundPage() {
  return (
    <div className="stack">
      <section className="card">
        <h1>Page not found</h1>
        <p className="muted">The page you requested doesn’t exist (or has moved).</p>
        <Link className="btn-primary" href="/">
          Back to {SITE.brandName}
        </Link>
      </section>
    </div>
  );
}
