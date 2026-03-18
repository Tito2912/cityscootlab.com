'use client';

import { useId } from 'react';
import { usePathname } from 'next/navigation';
import type { Lang } from '@/lib/site';
import { getLangFromPathname, localizedUrl, SITE, UI_TRANSLATIONS } from '@/lib/site';

export function LanguageSelect() {
  const selectId = useId();
  const pathname = usePathname() ?? '/';
  const lang = getLangFromPathname(pathname);
  const t = UI_TRANSLATIONS[lang];

  function onChange(nextLang: Lang) {
    try {
      localStorage.setItem('cityscootlab_lang_v1', nextLang);
    } catch {
      // ignore
    }
    window.location.href = localizedUrl(pathname, nextLang);
  }

  return (
    <div className="lang-select-container">
      <label className="sr-only" htmlFor={selectId}>
        {t.language}
      </label>
      <select
        className="lang-select"
        id={selectId}
        onChange={(e) => onChange(e.target.value as Lang)}
        value={lang}
      >
        {SITE.supportedLangs.map((l) => (
          <option key={l} value={l}>
            {l.toUpperCase()}
          </option>
        ))}
      </select>
    </div>
  );
}
