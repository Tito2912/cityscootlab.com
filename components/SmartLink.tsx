import type { AnchorHTMLAttributes, ReactNode } from 'react';

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href?: string;
  children?: ReactNode;
};

function mergeRel(existing: string | undefined, required: string[]): string | undefined {
  const tokens = new Set(String(existing ?? '').split(/\s+/).filter(Boolean));
  for (const token of required) tokens.add(token);
  return tokens.size ? Array.from(tokens).join(' ') : undefined;
}

function isIsinwheelCom(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return h === 'isinwheel.com' || h === 'www.isinwheel.com';
}

function isImpactAffiliate(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return h === 'sjv.io' || h.endsWith('.sjv.io');
}

function isAmazonShort(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return h === 'amzn.to';
}

function ensureIsinwheelRef(url: URL): URL {
  if (!url.searchParams.get('ref')) url.searchParams.set('ref', 'hdgyzzxp');
  return url;
}

export function SmartLink({ href, rel, ...props }: Props) {
  if (!href) return <a rel={rel} {...props} />;

  // Keep internal / hash links unchanged.
  if (href.startsWith('/') || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
    return <a href={href} rel={rel} {...props} />;
  }

  if (!href.startsWith('http://') && !href.startsWith('https://')) {
    return <a href={href} rel={rel} {...props} />;
  }

  try {
    const url = new URL(href);
    const shouldMarkAffiliate = isImpactAffiliate(url.hostname) || isAmazonShort(url.hostname) || isIsinwheelCom(url.hostname);
    const finalUrl = isIsinwheelCom(url.hostname) ? ensureIsinwheelRef(url) : url;
    const finalHref = finalUrl.toString();

    if (shouldMarkAffiliate) {
      const finalRel = mergeRel(rel, ['nofollow', 'sponsored', 'noopener', 'noreferrer']);
      return <a href={finalHref} rel={finalRel} {...props} />;
    }

    // Non-affiliate external link: keep safe rel defaults.
    const finalRel = mergeRel(rel, ['noopener', 'noreferrer']);
    return <a href={finalHref} rel={finalRel} {...props} />;
  } catch {
    return <a href={href} rel={rel} {...props} />;
  }
}
