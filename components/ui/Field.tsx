"use client";

import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export function TextField({ label, error, className = "", ...rest }: Props) {
  return (
    <div className={className}>
      {label && (
        <label className="mb-1 block text-xs font-extrabold text-[var(--c-ink)]">
          {label}
        </label>
      )}
      <input
        className={`input-field ${error ? "!border-[var(--c-danger)]" : ""}`}
        {...rest}
      />
      {error && (
        <p className="mt-1 text-[10px] font-bold text-[var(--c-danger)]">{error}</p>
      )}
    </div>
  );
}