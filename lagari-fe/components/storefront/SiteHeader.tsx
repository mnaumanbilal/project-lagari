"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { CartDrawer } from "@/components/storefront/CartDrawer";
import { LagariLogo } from "@/components/brand/LagariLogo";
import { useCart } from "@/lib/cart/cart-context";
import { CATEGORY_LABELS, type ProductCategory } from "@/lib/catalog";

const NAV_CATEGORIES: (ProductCategory | "all")[] = [
  "all",
  "for-men",
  "for-women",
  "unisex",
];

function categoryNavClass(active: boolean) {
  return active
    ? "font-label text-lagari-brass underline decoration-lagari-brass/50 underline-offset-[6px]"
    : "font-label text-lagari-muted transition-colors hover:text-lagari-brass";
}

function CategoryNavLinks({
  activeCategory,
  onNavigate,
  className,
  list = false,
}: {
  activeCategory: string | null;
  onNavigate?: () => void;
  className?: string;
  list?: boolean;
}) {
  const links = NAV_CATEGORIES.map((cat) => (
    <Link
      key={cat}
      href={cat === "all" ? "/shop" : `/shop?category=${cat}`}
      className={categoryNavClass(activeCategory === cat)}
      aria-current={activeCategory === cat ? "page" : undefined}
      onClick={onNavigate}
    >
      {CATEGORY_LABELS[cat]}
    </Link>
  ));

  if (list) {
    return (
      <ul className={className}>
        {NAV_CATEGORIES.map((cat) => (
          <li key={cat}>
            <Link
              href={cat === "all" ? "/shop" : `/shop?category=${cat}`}
              className={categoryNavClass(activeCategory === cat)}
              aria-current={activeCategory === cat ? "page" : undefined}
              onClick={onNavigate}
            >
              {CATEGORY_LABELS[cat]}
            </Link>
          </li>
        ))}
      </ul>
    );
  }

  return <nav className={className} aria-label="Main">{links}</nav>;
}

function ActiveCategoryNav({
  onNavigate,
  className,
  list = false,
}: {
  onNavigate?: () => void;
  className?: string;
  list?: boolean;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeCategory =
    pathname === "/shop" ? (searchParams.get("category") ?? "all") : null;

  return (
    <CategoryNavLinks
      activeCategory={activeCategory}
      onNavigate={onNavigate}
      className={className}
      list={list}
    />
  );
}

export function SiteHeader() {
  const { itemCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [bagOpen, setBagOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-lagari-border bg-lagari-deep/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <LagariLogo priority />

          <Suspense
            fallback={
              <CategoryNavLinks
                activeCategory={null}
                className="hidden items-center gap-8 md:flex"
              />
            }
          >
            <ActiveCategoryNav className="hidden items-center gap-8 md:flex" />
          </Suspense>

          <div className="flex items-center gap-3">
            <Link
              href="/shop"
              className="font-label hidden text-lagari-muted transition-colors hover:text-lagari-primary sm:inline"
            >
              Shop
            </Link>
            <button
              type="button"
              className="relative rounded-full border border-lagari-border px-4 py-2 font-label text-lagari-primary transition-colors hover:border-lagari-brass hover:text-lagari-brass md:hidden"
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
              aria-label="Toggle menu"
            >
              Menu
            </button>
            <button
              type="button"
              onClick={() => setBagOpen(true)}
              className="relative rounded-full border border-lagari-brass/40 bg-lagari-surface px-4 py-2 font-label text-lagari-brass transition-colors hover:bg-lagari-brass hover:text-lagari-deep"
            >
              Bag
              {itemCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-lagari-brass px-1 text-[10px] font-medium text-lagari-deep">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav
            className="border-t border-lagari-border px-4 py-4 md:hidden"
            aria-label="Mobile"
          >
            <Suspense
              fallback={
                <CategoryNavLinks
                  activeCategory={null}
                  className="flex flex-col gap-3"
                  list
                />
              }
            >
              <ActiveCategoryNav
                className="flex flex-col gap-3"
                list
                onNavigate={() => setMenuOpen(false)}
              />
            </Suspense>
          </nav>
        )}
      </header>

      <CartDrawer open={bagOpen} onClose={() => setBagOpen(false)} />
    </>
  );
}
