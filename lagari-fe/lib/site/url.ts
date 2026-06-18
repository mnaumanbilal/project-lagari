const DEFAULT_SITE_URL = "https://project-lagari.vercel.app";

function trimEnv(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

/** Canonical storefront origin (server-safe). */
export function getSiteUrl(): string {
  return trimEnv(process.env.NEXT_PUBLIC_SITE_URL) ?? DEFAULT_SITE_URL;
}

export function resolveProductUrl(slug: string): string {
  const base = getSiteUrl().replace(/\/$/, "");
  return `${base}/product/${slug}`;
}

/** Client share links: env first, then current origin. */
export function getClientSiteUrl(): string {
  const fromEnv = trimEnv(process.env.NEXT_PUBLIC_SITE_URL);
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (typeof window !== "undefined") return window.location.origin;
  return DEFAULT_SITE_URL;
}

export function resolveClientProductUrl(slug: string): string {
  return `${getClientSiteUrl()}/product/${slug}`;
}
