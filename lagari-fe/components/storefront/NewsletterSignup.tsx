"use client";

export function NewsletterSignup() {
  return (
    <form
      className="mt-6 flex max-w-sm border border-lagari-border"
      onSubmit={(e) => e.preventDefault()}
      aria-label="Newsletter signup"
    >
      <input
        type="email"
        name="email"
        placeholder="Email"
        className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-lagari-primary placeholder:text-lagari-muted focus:outline-none"
        autoComplete="email"
      />
      <button
        type="submit"
        className="border-l border-lagari-border px-4 font-label text-lagari-brass transition-colors duration-[var(--lagari-duration-fast)] hover:text-lagari-primary"
        aria-label="Subscribe"
      >
        →
      </button>
    </form>
  );
}
