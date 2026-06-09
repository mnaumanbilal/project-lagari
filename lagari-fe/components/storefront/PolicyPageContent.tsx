import Link from "next/link";
import type { PolicyDocument } from "@/lib/policies/types";

type Props = {
  policy: PolicyDocument;
};

export function PolicyPageContent({ policy }: Props) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <Link
        href="/"
        className="font-label text-lagari-muted transition-colors hover:text-lagari-brass"
      >
        ← Home
      </Link>

      <header className="mt-8 max-w-3xl">
        {policy.eyebrow ? (
          <p className="font-label text-lagari-brass">{policy.eyebrow}</p>
        ) : null}
        <h1 className="font-display mt-2 text-4xl font-semibold text-lagari-primary sm:text-5xl">
          {policy.title}
        </h1>
        {policy.lastUpdated ? (
          <p className="mt-4 font-label text-sm text-lagari-brass-dim">
            Last updated: {policy.lastUpdated}
          </p>
        ) : null}
        <div className="mt-5 space-y-4">
          {(Array.isArray(policy.intro) ? policy.intro : [policy.intro]).map(
            (paragraph) => (
              <p
                key={paragraph}
                className="text-base leading-relaxed text-lagari-muted sm:text-lg"
              >
                {paragraph}
              </p>
            ),
          )}
        </div>
      </header>

      {policy.sections.length > 3 ? (
        <nav
          aria-label="On this page"
          className="mt-10 rounded-sm border border-lagari-border bg-lagari-surface p-5 sm:p-6"
        >
          <p className="font-label text-xs uppercase tracking-[0.14em] text-lagari-brass">
            On this page
          </p>
          <ol className="mt-4 grid gap-2 sm:grid-cols-2">
            {policy.sections.map((section, index) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="text-sm text-lagari-muted transition-colors hover:text-lagari-brass"
                >
                  <span className="mr-2 font-label text-lagari-brass-dim">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      ) : null}

      <div className="mt-10 space-y-0 divide-y divide-lagari-border rounded-sm border border-lagari-border bg-lagari-surface">
        {policy.sections.map((section, index) => (
          <section
            key={section.id}
            id={section.id}
            className="scroll-mt-24 p-6 sm:p-8"
          >
            <div className="flex gap-4 sm:gap-5">
              <span
                aria-hidden
                className="font-display shrink-0 text-2xl font-semibold text-lagari-brass/50 sm:text-3xl"
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-xl font-semibold text-lagari-primary sm:text-2xl">
                  {section.title}
                </h2>

                {section.paragraphs?.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="mt-4 text-sm leading-relaxed text-lagari-muted sm:text-base"
                  >
                    {paragraph}
                  </p>
                ))}

                {section.bullets?.length ? (
                  <ul className="mt-4 list-disc space-y-2.5 pl-5 text-sm leading-relaxed text-lagari-muted sm:text-base">
                    {section.bullets.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : null}

                {section.links?.length ? (
                  <div className="mt-5 flex flex-wrap gap-3">
                    {section.links.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="font-label inline-flex items-center rounded-sm border border-lagari-brass/35 bg-lagari-brass/10 px-4 py-2 text-sm text-lagari-brass transition-colors hover:border-lagari-brass/60 hover:bg-lagari-brass/15"
                      >
                        {link.text}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        ))}
      </div>

      {policy.closingNote ? (
        <p className="mt-8 text-center text-sm text-lagari-muted">
          {policy.closingNote}
        </p>
      ) : null}
    </div>
  );
}
