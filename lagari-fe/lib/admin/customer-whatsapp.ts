/** Build wa.me DM link from a customer phone (PK numbers: 03… → 923…). */
export function customerWhatsAppHref(phone: string): string | null {
  if (!phone || phone === "—") return null;

  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return null;

  let normalized = digits;
  if (normalized.startsWith("92")) {
    // already international
  } else if (normalized.startsWith("0")) {
    normalized = `92${normalized.slice(1)}`;
  } else {
    normalized = `92${normalized}`;
  }

  return `https://wa.me/${normalized}`;
}
