import type { LucideIcon } from "lucide-react";
import { useLocale } from "next-intl";

export default function EmptyState({
  icon: Icon,
  fa,
  en,
  actionLabel,
  onAction,
}: {
  icon: LucideIcon;
  fa: { title: string; hint: string };
  en: { title: string; hint: string };
  actionLabel?: string;
  onAction?: () => void;
}) {
  const locale = useLocale();
  const t = locale === "fa" ? fa : en;

  return (
    <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-[32px] bg-[var(--c-surface)] px-6 py-16 text-center shadow-[0_10px_30px_-18px_rgba(74,36,48,0.35)]">
      {/* illustration پس‌زمینه */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-16 top-8 h-40 w-40 rounded-full bg-[#f8d8e0]/60 blur-3xl" />
        <div className="absolute -right-16 bottom-8 h-40 w-40 rounded-full bg-[#f6e7c6]/60 blur-3xl" />
        {/* کاغذ دفترچه‌ی خط‌دار */}
        <svg
          className="absolute left-1/2 top-6 -translate-x-1/2 opacity-[0.07]"
          width="220"
          height="120"
          viewBox="0 0 220 120"
          fill="none"
        >
          <rect x="30" y="10" width="160" height="100" rx="14" stroke="#4a2430" strokeWidth="3" />
          <line x1="52" y1="10" x2="52" y2="110" stroke="#d94f63" strokeWidth="3" />
          <line x1="70" y1="38" x2="170" y2="38" stroke="#4a2430" strokeWidth="3" strokeLinecap="round" />
          <line x1="70" y1="60" x2="150" y2="60" stroke="#4a2430" strokeWidth="3" strokeLinecap="round" />
          <line x1="70" y1="82" x2="160" y2="82" stroke="#4a2430" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>

      {/* آیکون در کپسول گرادیانی */}
      <div className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-[#f8d8e0] to-[#f6e7c6] text-[#4a2430] shadow-inner">
        <Icon size={28} strokeWidth={2} />
      </div>

      <h3 className="relative text-lg font-extrabold text-[#40222c]">{t.title}</h3>
      <p className="relative mt-2 max-w-sm text-sm leading-relaxed text-[var(--c-ink-soft)]">
        {t.hint}
      </p>

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="btn-primary relative mt-6 rounded-full px-6 py-3 text-sm font-extrabold shadow-lg transition hover:scale-105"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}