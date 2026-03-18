export function FAQ({ items }: { items: { q: string; a: string }[] }) {
  return (
    <section className="faq card" aria-label="FAQ">
      <h2 id="faq">FAQ</h2>
      {items.map((x) => (
        <details key={x.q}>
          <summary>{x.q}</summary>
          <p className="muted" style={{ marginTop: 8 }}>{x.a}</p>
        </details>
      ))}
    </section>
  );
}
