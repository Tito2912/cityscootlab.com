'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .trim()
    .split(/\s+/g)
    .filter(Boolean);
}

function buildHaystack(card: HTMLElement): string {
  const title = card.getAttribute('data-title') ?? '';
  const tags = card.getAttribute('data-tags') ?? '';
  const text = card.textContent ?? '';
  return `${title} ${tags} ${text}`.toLowerCase();
}

export function BlogSearchEnhancer() {
  const pathname = usePathname();

  useEffect(() => {
    const formEl = document.getElementById('blogSearch') as HTMLFormElement | null;
    const inputEl = document.getElementById('q') as HTMLInputElement | null;
    const scopeEl = document.querySelector<HTMLElement>('[data-search-scope]');
    if (!formEl || !inputEl || !scopeEl) return;

    const form = formEl;
    const input = inputEl;
    const scope = scopeEl;

    const noResults = document.getElementById('noResults') as HTMLElement | null;
    const cards = Array.from(scope.querySelectorAll<HTMLElement>('article'));
    if (!cards.length) return;

    function applyFilter(raw: string) {
      const tokens = tokenize(raw);
      let visible = 0;

      for (const card of cards) {
        if (!tokens.length) {
          card.hidden = false;
          visible += 1;
          continue;
        }

        const haystack = buildHaystack(card);
        const match = tokens.every((t) => haystack.includes(t));
        card.hidden = !match;
        if (match) visible += 1;
      }

      if (noResults) noResults.hidden = visible > 0;
    }

    function syncUrl(raw: string) {
      const value = raw.trim();
      const url = new URL(window.location.href);
      if (value) url.searchParams.set('q', value);
      else url.searchParams.delete('q');
      window.history.replaceState({}, '', url.toString());
    }

    function onInput() {
      applyFilter(input.value);
      syncUrl(input.value);
    }

    function onSubmit(event: Event) {
      event.preventDefault();
      applyFilter(input.value);
      syncUrl(input.value);
    }

    // Initialize from URL (?q=) on load.
    try {
      const q = new URLSearchParams(window.location.search).get('q') ?? '';
      if (q && !input.value) input.value = q;
    } catch {
      // ignore
    }

    applyFilter(input.value);
    input.addEventListener('input', onInput);
    form.addEventListener('submit', onSubmit);

    return () => {
      input.removeEventListener('input', onInput);
      form.removeEventListener('submit', onSubmit);
    };
  }, [pathname]);

  return null;
}
