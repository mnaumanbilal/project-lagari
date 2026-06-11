"use client";

import Link from "next/link";
import { MoreVertical } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export type AdminRowAction = {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: "default" | "destructive";
  disabled?: boolean;
};

type Props = {
  actions: AdminRowAction[];
  /** Accessible label for the menu trigger when multiple actions. */
  menuLabel?: string;
};

function actionClass(variant: AdminRowAction["variant"]) {
  return variant === "destructive"
    ? "text-lagari-danger hover:bg-lagari-danger/10"
    : "text-lagari-primary hover:bg-lagari-elevated/60";
}

function InlineAction({ action }: { action: AdminRowAction }) {
  const className = `text-sm font-medium hover:underline disabled:opacity-50 ${
    action.variant === "destructive" ? "text-lagari-danger" : "text-lagari-brass"
  }`;

  if (action.href) {
    return (
      <Link href={action.href} className={className}>
        {action.label}
      </Link>
    );
  }

  return (
    <button
      type="button"
      disabled={action.disabled}
      onClick={action.onClick}
      className={className}
    >
      {action.label}
    </button>
  );
}

export function AdminRowActionsMenu({ actions, menuLabel = "Actions" }: Props) {
  const enabled = actions.filter((a) => !a.disabled);
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

  if (enabled.length === 0) return null;

  if (enabled.length === 1) {
    return (
      <>
        <div className="lg:hidden">
          <InlineAction action={enabled[0]} />
        </div>
        <div className="hidden lg:flex lg:justify-end lg:gap-3">
          <InlineAction action={enabled[0]} />
        </div>
      </>
    );
  }

  return (
    <>
      {/* Mobile: kebab menu */}
      <div className="relative lg:hidden" ref={rootRef}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex h-8 w-8 items-center justify-center rounded-sm text-lagari-muted transition-colors hover:bg-lagari-elevated hover:text-lagari-brass"
          aria-label={menuLabel}
          aria-expanded={open}
        >
          <MoreVertical size={18} aria-hidden />
        </button>
        {open ? (
          <div className="absolute right-0 z-50 mt-1 min-w-[10rem] overflow-hidden rounded-lg border border-lagari-border bg-lagari-surface py-1 shadow-xl">
            {enabled.map((action) =>
              action.href ? (
                <Link
                  key={action.label}
                  href={action.href}
                  className={`block px-3 py-2 text-sm ${actionClass(action.variant)}`}
                  onClick={() => setOpen(false)}
                >
                  {action.label}
                </Link>
              ) : (
                <button
                  key={action.label}
                  type="button"
                  disabled={action.disabled}
                  className={`block w-full px-3 py-2 text-left text-sm ${actionClass(action.variant)}`}
                  onClick={() => {
                    action.onClick?.();
                    setOpen(false);
                  }}
                >
                  {action.label}
                </button>
              ),
            )}
          </div>
        ) : null}
      </div>

      {/* Desktop: inline links */}
      <div className="hidden lg:flex lg:justify-end lg:gap-3 font-label text-xs">
        {enabled.map((action) => (
          <InlineAction key={action.label} action={action} />
        ))}
      </div>
    </>
  );
}
