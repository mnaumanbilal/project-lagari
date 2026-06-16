export function productPath(slug: string | null | undefined): string | null {
  const normalized = slug?.trim();
  return normalized ? `/product/${normalized}` : null;
}
