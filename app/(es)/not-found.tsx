import Link from 'next/link';
import { SITE } from '@/lib/site';

export default function NotFoundPage() {
  return (
    <div className="stack">
      <section className="card">
        <h1>Página no encontrada</h1>
        <p className="muted">La página solicitada no existe (o se ha movido).</p>
        <Link className="btn-primary" href="/es/">
          Volver a {SITE.brandName}
        </Link>
      </section>
    </div>
  );
}

