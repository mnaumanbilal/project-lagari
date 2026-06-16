export function storefrontProductPath(slug: string): string {
  return `/product/${slug}`;
}

export function storefrontProductUrl(baseUrl: string, slug: string): string {
  const base = baseUrl.replace(/\/$/, "");
  return `${base}${storefrontProductPath(slug)}`;
}
