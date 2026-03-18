'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

type ButtonAndAnswer = {
  button: HTMLButtonElement;
  answer: HTMLElement;
};

function resolveAnswer(button: HTMLButtonElement): HTMLElement | null {
  const controlledId = button.getAttribute('aria-controls');
  if (controlledId) return document.getElementById(controlledId);

  const next = button.nextElementSibling;
  if (next instanceof HTMLElement && next.classList.contains('faq-a')) return next;
  return null;
}

export function FaqEnhancer() {
  const pathname = usePathname();

  useEffect(() => {
    const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('button.faq-q'));
    if (!buttons.length) return;

    const pairs: ButtonAndAnswer[] = [];
    const buttonToAnswer = new Map<HTMLButtonElement, HTMLElement>();
    for (const button of buttons) {
      const answer = resolveAnswer(button);
      if (!answer) continue;

      const expanded = button.getAttribute('aria-expanded') === 'true';
      answer.hidden = !expanded;
      answer.setAttribute('aria-hidden', expanded ? 'false' : 'true');
      pairs.push({ button, answer });
      buttonToAnswer.set(button, answer);
    }

    function closeSiblingsWithinSameFaqRoot(targetButton: HTMLButtonElement) {
      const root = targetButton.closest('.faq');
      if (!root) return;

      for (const { button, answer } of pairs) {
        if (button === targetButton) continue;
        if (!root.contains(button)) continue;
        button.setAttribute('aria-expanded', 'false');
        answer.hidden = true;
        answer.setAttribute('aria-hidden', 'true');
      }
    }

    function onClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      const button = target?.closest('button.faq-q') as HTMLButtonElement | null;
      if (!button) return;

      const answer = buttonToAnswer.get(button);
      if (!answer) return;

      const isExpanded = button.getAttribute('aria-expanded') === 'true';
      const nextExpanded = !isExpanded;

      if (nextExpanded) closeSiblingsWithinSameFaqRoot(button);

      button.setAttribute('aria-expanded', nextExpanded ? 'true' : 'false');
      answer.hidden = !nextExpanded;
      answer.setAttribute('aria-hidden', nextExpanded ? 'false' : 'true');
    }

    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [pathname]);

  return null;
}
