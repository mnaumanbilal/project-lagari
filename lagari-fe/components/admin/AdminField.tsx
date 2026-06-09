"use client";

import type { InputHTMLAttributes, ReactNode } from "react";
import { getFieldError, hasFieldError, type FieldErrors } from "@/lib/admin/field-errors";

type BaseProps = {
  label: string;
  fieldKey: string;
  errors?: FieldErrors;
  hint?: string;
  children?: ReactNode;
};

export function AdminTextField({
  label,
  fieldKey,
  errors,
  hint,
  required,
  value,
  onChange,
  type = "text",
}: BaseProps &
  Pick<BaseProps, "hint"> & {
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  const error = getFieldError(errors ?? {}, fieldKey);
  const invalid = hasFieldError(errors ?? {}, fieldKey);
  return (
    <div
      data-admin-field={fieldKey}
      className={`block${invalid ? " admin-field-invalid" : ""}`}
    >
      <label htmlFor={fieldKey} className="text-sm font-medium text-lagari-muted">
        {label}
        {required && <span className="text-lagari-danger"> *</span>}
      </label>
      <input
        id={fieldKey}
        name={fieldKey}
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        aria-describedby={error ? `${fieldKey}-error` : undefined}
        className="admin-input mt-1.5 w-full px-3 py-2.5"
      />
      {hint && !error && (
        <p className="mt-1 text-xs text-lagari-muted">{hint}</p>
      )}
      {error && (
        <p id={`${fieldKey}-error`} className="admin-field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function AdminTextArea({
  label,
  fieldKey,
  errors,
  value,
  onChange,
  rows = 4,
}: BaseProps & {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  const error = getFieldError(errors ?? {}, fieldKey);
  const invalid = hasFieldError(errors ?? {}, fieldKey);
  return (
    <div
      data-admin-field={fieldKey}
      className={`block${invalid ? " admin-field-invalid" : ""}`}
    >
      <label htmlFor={fieldKey} className="text-sm font-medium text-lagari-muted">
        {label}
      </label>
      <textarea
        id={fieldKey}
        name={fieldKey}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        className="admin-input mt-1.5 w-full resize-y px-3 py-2.5"
      />
      {error && (
        <p className="admin-field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function AdminVariantField({
  label,
  fieldKey,
  variantIndex,
  errors,
  inputProps,
}: {
  label: string;
  fieldKey: "sku" | "name" | "pricePkr" | "stock";
  variantIndex: number;
  errors?: FieldErrors;
  inputProps: InputHTMLAttributes<HTMLInputElement>;
}) {
  const fullKey = `variants.${variantIndex}.${fieldKey}`;
  const error = getFieldError(errors ?? {}, fullKey, variantIndex);
  const invalid = hasFieldError(errors ?? {}, fullKey);
  const id = `${fullKey}`;

  return (
    <div
      data-admin-field={fullKey}
      className={invalid ? "admin-field-invalid" : undefined}
    >
      <label htmlFor={id} className="mb-1 block text-xs font-medium text-lagari-muted">
        {label}
      </label>
      <input
        {...inputProps}
        id={id}
        aria-invalid={!!error}
        aria-label={label}
        className={`admin-input w-full px-2 py-1.5 text-sm ${inputProps.className ?? ""}`}
      />
      {error && (
        <p className="admin-field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
