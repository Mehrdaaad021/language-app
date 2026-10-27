"use client";

import { useLocale } from "next-intl";
import type { LucideIcon } from "lucide-react";

type Copy = { title: string; hint: string };

export default function EmptyState({
  icon: Icon,
  fa,
  en,
  actionLabel,
  onAction,
}: {
  icon: LucideIcon;
  fa: Copy;
  en: Copy;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const locale = useLocale();
  const c = locale === "fa" ? fa : en;

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl bg-[var(--c-surface)] px-6 py-14 text-center shadow-[0_10px_30px_-18px_rgba(74,36,48,0.35)]">
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--c-pink)] text-[var(--c-primary)]">
        <Icon size={34} strokeWidth={1.8} />
      </span>
      <div>
        <p className="text-base font-extrabold text-[var(--c-ink)]">{c.title}</p>
        <p className="mt-1 max-w-xs text-xs leading-6 text-[var(--c-ink-soft)]">{c.hint}</p>
      </div>
      {onAction && actionLabel && (
        <button
          type="button"
          onClick={onAction}
          className="btn-primary rounded-xl px-5 py-2.5 text-xs font-extrabold transition"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}