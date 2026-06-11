import Link from "next/link";
import { LagariLogo } from "@/components/brand/LagariLogo";
import { NewsletterSignup } from "@/components/storefront/NewsletterSignup";
import { SocialLinks } from "@/components/storefront/SocialLinks";
import { WhatsAppButton } from "@/components/storefront/WhatsAppButton";
import { CONTACT } from "@/lib/site/contact";

const QUICK_LINKS = [
  { label: "Shop", href: "/shop" },
  { label: "Contact Us", href: "/contact" },
  { label: "Terms of Service", href: "/policies/terms" },
  { label: "Exchange Policy", href: "/policies/exchange" },
  { label: "Shipping Policy", href: "/policies/shipping" },
  { label: "Privacy Policy", href: "/policies/privacy" },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-lagari-border bg-lagari-deep">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-3 lg:gap-8">
        <div>
          <LagariLogo linked={false} />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-lagari-muted">
            Artisanal impressions of iconic fragrances. Crafted for Pakistan —
            cash on delivery, no account required.
          </p>
          <NewsletterSignup />
          <div className="mt-6">
            <WhatsAppButton />
            <p className="mt-2 text-xs text-lagari-muted">{CONTACT.phone}</p>
          </div>
        </div>

        <div>
          <h2 className="font-display text-lg font-semibold text-lagari-primary">
            Quick links
          </h2>
          <ul className="mt-4 space-y-2.5">
            {QUICK_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-lagari-muted transition-[color,transform] duration-[var(--lagari-duration-fast)] hover:translate-x-0.5 hover:text-lagari-brass"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:text-right">
          <h2 className="font-display text-lg font-semibold text-lagari-primary">
            Follow
          </h2>
          <SocialLinks size="sm" className="mt-4 lg:justify-end" />
        </div>
      </div>

      <p className="border-t border-lagari-border py-5 text-center text-xs text-lagari-muted">
        © {new Date().getFullYear()} Lagari
      </p>
    </footer>
  );
}
