"use client";

import { useTranslations } from "next-intl";
import { LogOut } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { logoutAction } from "@/lib/server/auth-actions";

export default function LogoutButton({ iconOnly = false }: { iconOnly?: boolean }) {
  const t = useTranslations("Auth");
  const router = useRouter();

  const onClick = async () => {
    await logoutAction();
    router.replace("/login");
    router.refresh();
  };

  if (iconOnly) {
    return (
      <button
        onClick={onClick}
        aria-label={t("logout")}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[var(--color-ink-soft)] transition hover:bg-white/40 hover:text-[#B23A4C]"
      >
        <LogOut size={16} className="icon-flip" />
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="glass inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold transition hover:bg-white/40 hover:text-[#B23A4C]"
    >
      <LogOut size={15} className="icon-flip" />
      {t("logout")}
    </button>
  );
}