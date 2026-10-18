"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { LayoutDashboard, NotebookPen, GraduationCap } from "lucide-react";
import LocaleSwitcher from "@/components/LocaleSwitcher";
import LogoutButton from "@/components/auth/LogoutButton";
import ThemeToggle from "@/components/ui/ThemeToggle";

const NAV = [
  { icon: LayoutDashboard, key: "overview", href: "/student" },
  { icon: NotebookPen, key: "notebook", href: "/student/notebook" },
];

export default function StudentShell({
  children,
  studentName,
}: {
  children: ReactNode;
  studentName: string;
}) {
  const t = useTranslations("Student");
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/student" ? pathname === "/student" : pathname.startsWith(href);

  return (
    <>
      <div className="glass-bg">
        <div className="blob-3" />
      </div>

      <div className="sticky top-0 z-40 px-4 pt-4">
        <div className="glass-strong mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#E8697B] to-[#D94F63] text-white shadow-lg">
              <GraduationCap size={18} />
            </span>
            <div>
              <p className="text-sm font-extrabold">{t("portalTitle")}</p>
              <p className="text-[10px] text-[var(--color-ink-soft)]">{studentName}</p>
            </div>
          </div>

          <nav className="flex items-center gap-1">
            {NAV.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                prefetch
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition ${
                  isActive(item.href)
                    ? "bg-white/50 text-[var(--color-ink)]"
                    : "text-[var(--color-ink-soft)] hover:bg-white/25"
                }`}
              >
                <item.icon size={15} />
                <span className="hidden sm:inline">{t(item.key)}</span>
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle compact />
            <LogoutButton iconOnly />
            <LocaleSwitcher compact />
          </div>
        </div>
      </div>

      <main className="mx-auto w-full max-w-5xl p-4 md:p-8">{children}</main>
    </>
  );
}