import Link from "next/link";
import { productPath } from "@/lib/storefront/product-url";

type Props = {
  slug: string | null | undefined;
  title: string;
  className?: string;
};

/** Line item title linking to the storefront PDP when a slug is available. */
export function StorefrontProductLink({ slug, title, className }: Props) {
  const href = productPath(slug);
  if (!href) {
    return <span className={className}>{title}</span>;
  }

  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className ?? "text-lagari-primary hover:text-lagari-brass hover:underline"}
    >
      {title}
    </Link>
  );
}
