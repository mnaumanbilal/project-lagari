import { SiteFooter } from "@/components/storefront/SiteFooter";
import { SiteHeader } from "@/components/storefront/SiteHeader";
import { StorefrontProviders } from "@/components/storefront/StorefrontProviders";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StorefrontProviders>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </StorefrontProviders>
  );
}
