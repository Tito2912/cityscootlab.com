export type TocHeading = { id: string; text: string; level: number };

export function TableOfContents({ headings }: { headings: TocHeading[] }) {
  if (!headings?.length) return <p className="muted">(No headings yet)</p>;

  return (
    <ul>
      {headings.map((h) => (
        <li key={h.id} style={{ marginLeft: Math.max(0, (h.level - 2) * 10) }}>
          <a href={`#${h.id}`}>{h.text}</a>
        </li>
      ))}
    </ul>
  );
}
