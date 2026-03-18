import Link from 'next/link';
import { SITE } from '@/lib/site';

export default function NotFoundPage() {
  return (
    <div className="stack">
      <section className="card">
        <h1>Page introuvable</h1>
        <p className="muted">La page demandée n’existe pas (ou a été déplacée).</p>
        <Link className="btn-primary" href="/">
          Retour à {SITE.brandName}
        </Link>
      </section>
    </div>
  );
}
