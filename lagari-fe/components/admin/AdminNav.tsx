"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ADMIN_ANALYTICS_PATH,
  ADMIN_CONSOLE_PATH,
  ADMIN_ORDERS_PATH,
  ADMIN_PRODUCTS_PATH,
  ADMIN_REVIEWS_PATH,
} from "@/lib/admin/constants";

const links = [
  { href: ADMIN_CONSOLE_PATH, label: "Dashboard" },
  { href: ADMIN_ORDERS_PATH, label: "Orders" },
  { href: ADMIN_PRODUCTS_PATH, label: "Products" },
  { href: ADMIN_ANALYTICS_PATH, label: "Analytics" },
  { href: ADMIN_REVIEWS_PATH, label: "Reviews" },
];

type Props = {
  variant?: "sidebar" | "mobile";
};

export function AdminNav({ variant = "sidebar" }: Props) {
  const pathname = usePathname();
  const isMobile = variant === "mobile";

  return (
    <nav
      className={
        isMobile
          ? "flex gap-1 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          : "flex flex-col gap-1"
      }
    >
      {links.map((link) => {
        const active =
          pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`shrink-0 rounded-sm px-3 py-2 text-sm font-medium transition-colors ${
              isMobile ? "whitespace-nowrap" : ""
            } ${
              active
                ? "bg-lagari-brass/20 font-medium text-lagari-primary"
                : "text-lagari-muted hover:bg-lagari-border/40 hover:text-lagari-primary"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
