"use client";

import Link from "next/link";
import { User } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Props = {
  onSignOut: () => void;
};

export function AdminUserMenu({ onSignOut }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-lagari-border bg-lagari-elevated/60 text-lagari-muted transition-colors hover:border-lagari-brass hover:text-lagari-brass"
        aria-label="Account menu"
        aria-expanded={open}
      >
        <User size={18} aria-hidden />
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 min-w-[11rem] overflow-hidden rounded-lg border border-lagari-border bg-lagari-surface py-1 shadow-xl">
          <Link
            href="/"
            className="block px-4 py-2.5 text-sm text-lagari-primary transition-colors hover:bg-lagari-elevated/60"
            onClick={() => setOpen(false)}
          >
            Storefront
          </Link>
          <button
            type="button"
            className="block w-full px-4 py-2.5 text-left text-sm text-lagari-brass transition-colors hover:bg-lagari-elevated/60"
            onClick={() => {
              setOpen(false);
              onSignOut();
            }}
          >
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}
