import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function NotFound() {
  const t = await getTranslations("Meta");

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[var(--c-pink)]">
        <span className="text-4xl font-extrabold text-[var(--c-primary)]">404</span>
      </div>
      <div>
        <h2 className="text-xl font-extrabold">{t("notFoundTitle")}</h2>
        <p className="mt-2 text-sm text-[var(--c-ink-soft)]">{t("notFoundHint")}</p>
      </div>
      <Link
        href="/dashboard"
        className="btn-primary rounded-xl px-6 py-2.5 text-xs font-extrabold shadow-lg transition"
      >
        {t("backToDashboard")}
      </Link>
    </div>
  );
}