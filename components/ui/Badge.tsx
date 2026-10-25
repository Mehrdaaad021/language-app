import type { ReactNode } from "react";

type Tone = "success" | "info" | "warn" | "danger" | "neutral";

const TONES: Record<Tone, string> = {
  success: "bg-[var(--c-success-bg)] text-[var(--c-success)]",
  info: "bg-[var(--c-pink)] text-[var(--c-primary)]",
  warn: "bg-[var(--c-warn-bg)] text-[var(--c-warn)]",
  danger: "bg-[var(--c-danger-bg)] text-[var(--c-danger)]",
  neutral: "bg-[var(--c-surface-2)] text-[var(--c-ink-soft)]",
};

export default function Badge({
  tone = "neutral",
  className = "",
  children,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-extrabold ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}