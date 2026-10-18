"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Languages } from "lucide-react";

export default function LocaleSwitcher({ compact = false }: { compact?: boolean }) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("Nav");
  const next = locale === "fa" ? "en" : "fa";

  return (
    <button
      onClick={() => router.replace(pathname, { locale: next })}
      className={`glass inline-flex items-center gap-2 rounded-full font-bold transition-all hover:bg-white/40 ${
        compact ? "px-3 py-1.5 text-[11px]" : "px-5 py-2.5 text-xs"
      }`}
    >
      <Languages size={compact ? 14 : 16} />
      {t("switchLocale")}
    </button>
  );
}