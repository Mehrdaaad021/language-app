"use client";

import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

function FieldShell({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-[var(--color-ink-soft)]">{label}</span>
      {children}
      {error && <span className="mt-1.5 block text-[11px] font-bold text-[#B23A4C]">{error}</span>}
    </label>
  );
}

function controlClass(error?: string) {
  return `w-full rounded-2xl border bg-white/40 px-4 py-2.5 text-sm font-medium text-[var(--color-ink)] backdrop-blur-md transition placeholder:text-[var(--color-ink-soft)]/60 focus:outline-none ${
    error
      ? "border-[rgba(178,58,76,0.5)] focus:border-[#B23A4C] focus:bg-white/55"
      : "border-white/60 focus:border-white/90 focus:bg-white/55"
  }`;
}

export function TextField({
  label, error, ...props
}: { label: string; error?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <FieldShell label={label} error={error}>
      <input className={controlClass(error)} {...props} />
    </FieldShell>
  );
}

export function SelectField({
  label, error, children, ...props
}: { label: string; error?: string; children: ReactNode } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <FieldShell label={label} error={error}>
      <select className={controlClass(error)} {...props}>{children}</select>
    </FieldShell>
  );
}