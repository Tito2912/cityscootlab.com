'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { getLangFromPathname } from '@/lib/site';

export function LangHtmlUpdater() {
  const pathname = usePathname() ?? '/';

  useEffect(() => {
    try {
      document.documentElement.lang = getLangFromPathname(pathname);
    } catch {
      // ignore
    }
  }, [pathname]);

  return null;
}

