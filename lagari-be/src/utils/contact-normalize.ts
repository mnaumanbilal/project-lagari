/**
 * Contact normalisation — used by both checkout and review submission
 * so phone/email keys always match between orders and reviews.
 *
 * Rules (Pakistan-centric):
 *   Phone : strip spaces / dashes / dots / parentheses
 *           +92 or 0092  →  leading 0 (domestic format)
 *           Must be 11 digits starting with 03
 *   Email : lowercase + trim
 */

export class ContactValidationError extends Error {
  constructor(
    public field: "phone" | "email",
    message: string,
  ) {
    super(message);
    this.name = "ContactValidationError";
  }
}

/**
 * Normalise a Pakistani mobile number to domestic 03xx format.
 * Returns the normalised string or throws ContactValidationError.
 */
export function normalizePkPhone(raw: string): string {
  if (!raw || !raw.trim()) {
    throw new ContactValidationError("phone", "Phone number is required.");
  }

  // Remove all formatting characters
  let digits = raw.replace(/[\s\-().+]/g, "");

  // Convert +92 or 0092 international prefix to domestic 0
  if (digits.startsWith("0092")) digits = "0" + digits.slice(4);
  else if (digits.startsWith("92") && digits.length === 12) digits = "0" + digits.slice(2);

  if (!/^03\d{9}$/.test(digits)) {
    throw new ContactValidationError(
      "phone",
      "Please enter a valid Pakistani mobile number (e.g. 0311-1234567).",
    );
  }

  return digits;
}

/**
 * Attempt to normalise a phone, returning null on failure instead of throwing.
 * Use for optional phone fields that fall back to email lookup.
 */
export function tryNormalizePkPhone(raw: string): string | null {
  try {
    return normalizePkPhone(raw);
  } catch {
    return null;
  }
}

/** Normalise email: trim + lowercase. Throws ContactValidationError on bad format. */
export function normalizeEmail(raw: string): string {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) throw new ContactValidationError("email", "Email is required.");
  // Basic RFC-5322 surface check — full validation is on the DB unique constraint
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    throw new ContactValidationError("email", "Please enter a valid email address.");
  }
  return trimmed;
}

/**
 * Validate and normalise a contact payload where at least one of
 * phone or email must be present.
 *
 * Priority: phone resolves customer if provided and valid.
 * Email is fallback only.
 */
export function normalizeContact(input: {
  phone?: string | null;
  email?: string | null;
}): { phone: string | null; email: string | null } {
  const rawPhone = input.phone?.trim() ?? "";
  const rawEmail = input.email?.trim() ?? "";

  if (!rawPhone && !rawEmail) {
    throw new ContactValidationError(
      "phone",
      "Please provide the phone number or email you used when placing your order.",
    );
  }

  const phone = rawPhone ? tryNormalizePkPhone(rawPhone) : null;
  let email: string | null = null;

  if (rawEmail) {
    try {
      email = normalizeEmail(rawEmail);
    } catch {
      // If phone is already valid, a bad email format is a soft warning, not a blocker
      if (!phone) {
        throw new ContactValidationError("email", "Please enter a valid email address.");
      }
    }
  }

  if (!phone && !email) {
    throw new ContactValidationError(
      "phone",
      "Please enter a valid phone number (e.g. 0311-1234567).",
    );
  }

  return { phone, email };
}
