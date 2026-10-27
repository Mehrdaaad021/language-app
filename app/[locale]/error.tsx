"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import * as Sentry from "@sentry/nextjs";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("Meta");

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--c-danger-bg)] text-[var(--c-danger)]">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <div>
        <h2 className="text-xl font-extrabold">{t("errorTitle")}</h2>
        <p className="mt-2 text-sm text-[var(--c-ink-soft)]">{t("errorHint")}</p>
      </div>
      <button
        onClick={reset}
        className="btn-primary rounded-xl px-6 py-2.5 text-xs font-extrabold shadow-lg transition"
      >
        {t("tryAgain")}
      </button>
    </div>
  );
}