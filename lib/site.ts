export const SITE = {
  baseUrl: 'https://cityscootlab.com',
  domain: 'cityscootlab.com',
  brandName: 'Cityscootlab',
  productName: 'Cityscootlab',
  ga4Id: 'G-962GK50F4L',
  companyName: 'E-Com Shop',
  companyAddress: '60 rue François 1er, 75008 PARIS',
  companyId: 'SIREN 934934308',
  managerName: 'Tony CARON',
  hostName: 'Netlify',
  contactEmail: 'contact.ecomshopfrance@gmail.com',
  supportedLangs: ['en', 'fr', 'es', 'de'] as const,
};

export type Lang = (typeof SITE.supportedLangs)[number];

export const AFFILIATE: Record<Lang, { label: string; url: string }> = {
  en: { label: 'Shop deals', url: 'https://www.isinwheel.com/?ref=hdgyzzxp' },
  fr: { label: 'Voir les offres', url: 'https://isinwheelfr.sjv.io/c/6464691/3270712/15812' },
  es: { label: 'Ver ofertas', url: 'https://www.isinwheel.com/?ref=hdgyzzxp' },
  de: { label: 'Angebote ansehen', url: 'https://www.isinwheel.com/?ref=hdgyzzxp' },
};

export const UI_TRANSLATIONS: Record<
  Lang,
  {
    deals: string;
    topPicks: string;
    compare: string;
    blog: string;
    about: string;
    methodology: string;
    sources: string;
    contact: string;
    legal: string;
    privacy: string;
    manageCookies: string;
    cookie: string;
    accept: string;
    refuse: string;
    language: string;
    menu: string;
    shopDeals: string;
    onThisPage: string;
    jumpTo: string;
    quickAnswer: string;
    nextSteps: string;
  }
> = {
  en: {
    deals: 'Deals',
    topPicks: 'Top picks',
    compare: 'Compare',
    blog: 'Blog',
    about: 'About',
    methodology: 'How we test',
    sources: 'Sources',
    contact: 'Contact',
    legal: 'Legal notice',
    privacy: 'Privacy policy',
    manageCookies: 'Manage cookies',
    cookie: 'We use analytics cookies (Google Analytics 4) to improve the site.',
    accept: 'Accept',
    refuse: 'Refuse',
    language: 'Language',
    menu: 'Menu',
    shopDeals: 'Shop deals',
    onThisPage: 'On this page',
    jumpTo: 'Jump to',
    quickAnswer: 'Quick answer',
    nextSteps: 'Next steps',
  },
  fr: {
    deals: 'Offres',
    topPicks: 'Top picks',
    compare: 'Comparer',
    blog: 'Blog',
    about: 'À propos',
    methodology: 'Méthodologie',
    sources: 'Sources',
    contact: 'Contact',
    legal: 'Mentions légales',
    privacy: 'Politique de confidentialité',
    manageCookies: 'Gérer les cookies',
    cookie: 'Nous utilisons des cookies analytiques (Google Analytics 4) pour améliorer le site.',
    accept: 'Accepter',
    refuse: 'Refuser',
    language: 'Langue',
    menu: 'Menu',
    shopDeals: 'Voir les offres',
    onThisPage: 'Sur cette page',
    jumpTo: 'Aller à',
    quickAnswer: 'Réponse rapide',
    nextSteps: 'Pour aller plus loin',
  },
  es: {
    deals: 'Ofertas',
    topPicks: 'Selección',
    compare: 'Comparar',
    blog: 'Blog',
    about: 'Acerca de',
    methodology: 'Metodología',
    sources: 'Fuentes',
    contact: 'Contacto',
    legal: 'Aviso legal',
    privacy: 'Política de privacidad',
    manageCookies: 'Gestionar cookies',
    cookie: 'Usamos cookies analíticas (Google Analytics 4) para mejorar el sitio.',
    accept: 'Aceptar',
    refuse: 'Rechazar',
    language: 'Idioma',
    menu: 'Menú',
    shopDeals: 'Ver ofertas',
    onThisPage: 'En esta página',
    jumpTo: 'Saltar a',
    quickAnswer: 'Respuesta rápida',
    nextSteps: 'Siguientes pasos',
  },
  de: {
    deals: 'Deals',
    topPicks: 'Top-Picks',
    compare: 'Vergleichen',
    blog: 'Blog',
    about: 'Über uns',
    methodology: 'Methodik',
    sources: 'Quellen',
    contact: 'Kontakt',
    legal: 'Impressum',
    privacy: 'Datenschutz',
    manageCookies: 'Cookies verwalten',
    cookie: 'Wir verwenden Analyse-Cookies (Google Analytics 4), um die Website zu verbessern.',
    accept: 'Akzeptieren',
    refuse: 'Ablehnen',
    language: 'Sprache',
    menu: 'Menü',
    shopDeals: 'Angebote ansehen',
    onThisPage: 'Auf dieser Seite',
    jumpTo: 'Springe zu',
    quickAnswer: 'Kurzantwort',
    nextSteps: 'Nächste Schritte',
  },
};

export function normalizeLang(lang: unknown): Lang {
  const normalized = String(lang ?? '').toLowerCase();
  return (SITE.supportedLangs as readonly string[]).includes(normalized) ? (normalized as Lang) : 'en';
}

function normalizePathname(pathname: string): string {
  let path = pathname || '/';
  if (path !== '/') path = path.replace(/\/+$/, '');
  return path.replace(/\.html$/, '');
}

export function getLangFromPathname(pathname: string): Lang {
  const path = normalizePathname(pathname);
  if (path === '/fr' || path.startsWith('/fr/')) return 'fr';
  if (path === '/es' || path.startsWith('/es/')) return 'es';
  if (path === '/de' || path.startsWith('/de/')) return 'de';
  return 'en';
}

export function prefixPath(lang: Lang): string {
  return lang === 'en' ? '' : `/${lang}`;
}

type TranslationKey =
  | 'home'
  | 'blog_index'
  | 'commuter_guide_2025'
  | 'about'
  | 'methodology'
  | 'sources'
  | 'contact'
  | 'legal_notice'
  | 'privacy_policy';

const ROUTE_BY_KEY: Record<TranslationKey, Record<Lang, string>> = {
  home: {
    en: '/',
    fr: '/fr/',
    es: '/es/',
    de: '/de/',
  },
  blog_index: {
    en: '/blog',
    fr: '/fr/blog',
    es: '/es/blog',
    de: '/de/blog',
  },
  commuter_guide_2025: {
    en: '/isinwheel-commuter-guide-2025',
    fr: '/fr/isinwheel-commuter-guide-2025',
    es: '/es/isinwheel-commuter-guide-2025',
    de: '/de/isinwheel-commuter-guide-2025',
  },
  about: {
    en: '/about',
    fr: '/fr/a-propos',
    es: '/es/about',
    de: '/de/about',
  },
  methodology: {
    en: '/methodology',
    fr: '/fr/methodologie',
    es: '/es/methodology',
    de: '/de/methodology',
  },
  sources: {
    en: '/sources',
    fr: '/fr/sources',
    es: '/es/sources',
    de: '/de/sources',
  },
  contact: {
    en: '/contact',
    fr: '/fr/contact',
    es: '/es/contact',
    de: '/de/contact',
  },
  legal_notice: {
    en: '/legal-notice',
    fr: '/fr/mentions-legales',
    es: '/es/legal-notice',
    de: '/de/legal-notice',
  },
  privacy_policy: {
    en: '/privacy-policy',
    fr: '/fr/politique-de-confidentialite',
    es: '/es/privacy-policy',
    de: '/de/privacy-policy',
  },
};

function translationKeyFromPath(pathname: string): TranslationKey | null {
  const p = normalizePathname(pathname);
  if (p === '/' || p === '') return 'home';
  if (p === '/blog') return 'blog_index';
  if (p === '/isinwheel-commuter-guide-2025' || p === '/blog-1') return 'commuter_guide_2025';
  if (p === '/about' || p === '/a-propos') return 'about';
  if (p === '/methodology' || p === '/methodologie') return 'methodology';
  if (p === '/sources') return 'sources';
  if (p === '/contact') return 'contact';
  if (p === '/mentions-legales' || p === '/legal-notice') return 'legal_notice';
  if (p === '/politique-de-confidentialite' || p === '/privacy-policy') return 'privacy_policy';
  return null;
}

export function homePath(lang: Lang): string {
  return ROUTE_BY_KEY.home[lang];
}

export function blogIndexPath(lang: Lang): string {
  return ROUTE_BY_KEY.blog_index[lang];
}

export function guidePath(lang: Lang): string {
  return ROUTE_BY_KEY.commuter_guide_2025[lang];
}

export function aboutPath(lang: Lang): string {
  return ROUTE_BY_KEY.about[lang];
}

export function methodologyPath(lang: Lang): string {
  return ROUTE_BY_KEY.methodology[lang];
}

export function sourcesPath(lang: Lang): string {
  return ROUTE_BY_KEY.sources[lang];
}

export function contactPath(lang: Lang): string {
  return ROUTE_BY_KEY.contact[lang];
}

export function primaryAffiliateUrl(lang: Lang): string {
  return AFFILIATE[lang].url;
}

export function legalNoticePath(lang: Lang): string {
  return ROUTE_BY_KEY.legal_notice[lang];
}

export function privacyPath(lang: Lang): string {
  return ROUTE_BY_KEY.privacy_policy[lang];
}

export function localizedUrl(pathname: string, lang: Lang): string {
  const target = normalizeLang(lang);
  const path = normalizePathname(pathname);

  // Strip any existing lang prefix (fr/es/de). EN has no prefix.
  const withoutPrefix =
    path === '/fr' || path.startsWith('/fr/')
      ? path.replace(/^\/fr\b/, '') || '/'
      : path === '/es' || path.startsWith('/es/')
        ? path.replace(/^\/es\b/, '') || '/'
        : path === '/de' || path.startsWith('/de/')
          ? path.replace(/^\/de\b/, '') || '/'
          : path;

  const key = translationKeyFromPath(withoutPrefix);
  if (key) return ROUTE_BY_KEY[key][target];

  // Fallback: keep same path after stripping prefix, just add new prefix.
  if (withoutPrefix === '/' || withoutPrefix === '') return homePath(target);
  const cleaned = withoutPrefix.startsWith('/') ? withoutPrefix : `/${withoutPrefix}`;
  return `${prefixPath(target)}${cleaned}`;
}
