/** Allowlisted HTML for product descriptions (admin-authored). */
export function sanitizeProductHtml(html: string): string {
  if (!html?.trim()) return "";

  let out = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    .replace(/javascript:/gi, "");

  const allowed =
    /^<\/?(p|br|strong|em|u|ul|ol|li|h2|h3|hr|a|img)(\s+[^>]*)?>$/i;
  out = out.replace(/<[^>]+>/g, (tag) => (allowed.test(tag.trim()) ? tag : ""));

  return out.trim();
}
