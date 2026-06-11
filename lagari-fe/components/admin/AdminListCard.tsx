"use client";

import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

/** Mobile list row shell — admin-card padding and spacing. */
export function AdminListCard({ children, className = "" }: Props) {
  return (
    <li className={`admin-card p-4 ${className}`.trim()}>{children}</li>
  );
}

type FieldProps = {
  label: string;
  value: ReactNode;
  className?: string;
};

export function AdminListCardField({ label, value, className = "" }: FieldProps) {
  return (
    <div className={className}>
      <dt className="text-xs font-medium text-lagari-brass-dim">{label}</dt>
      <dd className="mt-0.5 break-words text-sm text-lagari-primary">{value}</dd>
    </div>
  );
}

type GridProps = {
  children: ReactNode;
  className?: string;
};

export function AdminListCardFields({ children, className = "" }: GridProps) {
  return (
    <dl className={`mt-3 grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2 sm:gap-y-3 ${className}`.trim()}>
      {children}
    </dl>
  );
}
