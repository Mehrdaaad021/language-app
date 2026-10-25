"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "glass" | "danger";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  icon?: ReactNode;
};

const STYLES: Record<Variant, string> = {
  primary: "btn-primary shadow-[0_10px_24px_-12px_rgba(74,36,48,0.5)]",
  secondary: "btn-secondary",
  ghost: "btn-ghost",
  glass: "bg-[var(--c-surface-2)] text-[var(--c-ink)] hover:bg-[var(--c-surface-3)]",
  danger: "bg-[var(--c-danger-bg)] text-[var(--c-danger)] hover:brightness-95",
};

export default function Button({
  variant = "primary",
  icon,
  className = "",
  children,
  ...rest
}: Props) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold transition disabled:opacity-60 ${STYLES[variant]} ${className}`}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}