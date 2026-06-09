import Link from "next/link";
import {
  Clock,
  Mail,
  MapPin,
  MessageCircle,
  Package,
  Phone,
} from "lucide-react";
import { SocialLinks } from "@/components/storefront/SocialLinks";
import { CONTACT } from "@/lib/site/contact";

function ContactCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article className="rounded-sm border border-lagari-border bg-lagari-surface p-6 sm:p-7">
      <div className="flex items-start gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-lagari-brass/25 bg-lagari-brass/10 text-lagari-brass">
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-xl font-semibold text-lagari-primary">
            {title}
          </h2>
          <div className="mt-3 space-y-2 text-sm leading-relaxed text-lagari-muted">
            {children}
          </div>
        </div>
      </div>
    </article>
  );
}

export function ContactPageContent() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <Link
        href="/"
        className="font-label text-lagari-muted transition-colors hover:text-lagari-brass"
      >
        ← Home
      </Link>

      <header className="mt-8 max-w-2xl">
        <p className="font-label text-lagari-brass">Contact</p>
        <h1 className="font-display mt-2 text-4xl font-semibold text-lagari-primary sm:text-5xl">
          We&apos;re here to help
        </h1>
        <p className="mt-5 text-base leading-relaxed text-lagari-muted sm:text-lg">
          Whether you have questions about our products, orders, exchanges, or
          general inquiries — our team is ready to assist you.
        </p>
      </header>

      <div className="mt-12 grid gap-5 lg:grid-cols-2">
        <ContactCard icon={Phone} title="Customer support">
          <p className="text-lagari-primary">Phone / WhatsApp</p>
          <p className="flex flex-wrap gap-x-4 gap-y-1">
            <a
              href={CONTACT.phoneHref}
              className="font-medium text-lagari-brass transition-colors hover:underline"
            >
              {CONTACT.phone}
            </a>
            <a
              href={CONTACT.whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-medium text-lagari-brass transition-colors hover:underline"
            >
              <MessageCircle className="h-4 w-4" strokeWidth={1.75} />
              Chat on WhatsApp
            </a>
          </p>
          <p className="pt-2 text-lagari-primary">Email</p>
          <a
            href={CONTACT.emailHref}
            className="font-medium text-lagari-brass transition-colors hover:underline"
          >
            {CONTACT.email}
          </a>
        </ContactCard>

        <ContactCard icon={MapPin} title="LAGARI e-store">
          <p className="text-lagari-primary">{CONTACT.city}</p>
          <p>Postal code: {CONTACT.postalCode}</p>
        </ContactCard>

        <ContactCard icon={Package} title="Order & exchange support">
          <p>
            For order-related concerns, please include the following so we can
            resolve your issue quickly:
          </p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>Your order number</li>
            <li>Full name on the order</li>
            <li>Clear photos or videos (if reporting damage)</li>
          </ul>
        </ContactCard>

        <ContactCard icon={Clock} title="Response time">
          <p>
            We aim to respond within{" "}
            <span className="text-lagari-primary">{CONTACT.responseTime}</span>.
          </p>
          <p>
            During peak seasons, responses may take slightly longer. Thank you
            for your patience.
          </p>
        </ContactCard>
      </div>

      <section className="mt-10 rounded-sm border border-lagari-border bg-lagari-elevated/60 p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold text-lagari-primary">
              Stay connected
            </h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-lagari-muted">
              Follow LAGARI for new impressions, behind-the-scenes content, and
              updates from the house.
            </p>
          </div>
          <SocialLinks />
        </div>
      </section>

      <footer className="mt-14 border-t border-lagari-border pt-10 text-center">
        <p className="font-display text-2xl font-semibold tracking-wide text-lagari-primary sm:text-3xl">
          LAGARI
        </p>
        <p className="mt-2 font-label text-lagari-brass">{CONTACT.tagline}</p>
      </footer>
    </div>
  );
}
