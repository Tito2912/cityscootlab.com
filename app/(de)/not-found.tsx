import Link from 'next/link';
import { SITE } from '@/lib/site';

export default function NotFoundPage() {
  return (
    <div className="stack">
      <section className="card">
        <h1>Seite nicht gefunden</h1>
        <p className="muted">Die angeforderte Seite existiert nicht (oder wurde verschoben).</p>
        <Link className="btn-primary" href="/de/">
          Zurück zu {SITE.brandName}
        </Link>
      </section>
    </div>
  );
}

