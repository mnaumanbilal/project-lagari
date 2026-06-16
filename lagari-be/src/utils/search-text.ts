/** Trim and collapse whitespace for user-facing search terms. */
export function normalizeSearchTerm(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

/** Escape `%`, `_`, and `\` for safe use inside SQL `LIKE` / `ILIKE` patterns. */
export function escapeLikePattern(term: string): string {
  return term.replace(/[%_\\]/g, "\\$&");
}

/** Wrap a normalized term as a case-insensitive contains pattern. */
export function ilikeContainsPattern(term: string): string {
  const normalized = normalizeSearchTerm(term);
  if (!normalized) return "";
  return `%${escapeLikePattern(normalized)}%`;
}
