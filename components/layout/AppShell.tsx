"use client";

import { useState, type ReactNode } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import {
  LayoutDashboard,
  GraduationCap,
  CalendarDays,
  Wallet,
  NotebookPen,
  BookOpen,
  Search,
  BarChart3,
  Settings as SettingsIcon,
} from "lucide-react";
import LocaleSwitcher from "@/components/LocaleSwitcher";
import LogoutButton from "@/components/auth/LogoutButton";
import ThemeToggle from "@/components/ui/ThemeToggle";
import CommandPalette from "@/components/CommandPalette";
import NotificationBell from "@/components/NotificationBell";
import DockNav from "@/components/layout/DockNav";

const NAV_ALL = [
  { icon: LayoutDashboard, key: "dashboard", href: "/dashboard" },
  { icon: BarChart3, key: "landing", href: "/dashboard/landing-editor" },
  { icon: GraduationCap, key: "students", href: "/students" },
  { icon: CalendarDays, key: "sessions", href: "/sessions" },
  { icon: Wallet, key: "payments", href: "/payments" },
  { icon: NotebookPen, key: "notes", href: "/notes" },
  { icon: BarChart3, key: "analytics", href: "/analytics" },
  { icon: SettingsIcon, key: "settings", href: "/settings" },
];

const spring = { type: "spring", stiffness: 380, damping: 30 } as const;

export default function AppShell({
  children,
  user,
  isOwner = false,
}: {
  children: ReactNode;
  user?: { name: string; email: string };
  isOwner?: boolean;
}) {
  const tn = useTranslations("Nav");
  const t = useTranslations("Dashboard");
  const tp = useTranslations("Palette");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const pathname = usePathname();

  // ویرایشگر ویترین فقط برای مالک اصلی
  const nav = NAV_ALL.filter((item) => item.key !== "landing" || isOwner);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <MotionConfig reducedMotion="user">
      <div className="glass-bg">
        <div className="blob-3" />
      </div>

      {/* نوار بالای موبایل */}
      <div className="sticky top-0 z-40 px-4 pt-4 md:hidden">
        <div className="glass-strong flex items-center justify-between rounded-2xl px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#E8697B] to-[#D94F63] text-white shadow-lg">
              <BookOpen size={18} />
            </span>
            <p className="text-sm font-extrabold">{t("brand")}</p>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell compact />
            <ThemeToggle compact />
            <LogoutButton iconOnly />
            <LocaleSwitcher compact />
          </div>
        </div>

        {/* ناوبری موبایل — پیِل فعال مارون تیره */}
        <nav className="glass mt-2 flex justify-between rounded-2xl px-2 py-1.5">
          {nav.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              prefetch
              aria-label={tn(item.key)}
              className={`relative flex h-10 w-10 items-center justify-center rounded-xl ${
                isActive(item.href) ? "text-[#f6eede]" : "text-[var(--color-ink-soft)]"
              }`}
            >
              {isActive(item.href) && (
                <motion.span
                  layoutId="nav-mobile"
                  className="absolute inset-0 rounded-xl bg-[#4a2430]"
                  transition={spring}
                />
              )}
              <item.icon size={18} className="relative z-10" />
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex min-h-screen">
        {/* منوی کناری دسکتاپ */}
        <aside className="hidden w-72 p-6 md:block">
          <div className="glass-strong flex h-full flex-col rounded-[28px] p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E8697B] to-[#D94F63] text-white shadow-[0_10px_26px_-10px_rgba(217,79,99,0.7)]">
                <BookOpen size={22} />
              </div>
              <div>
                <p className="font-extrabold">{t("brand")}</p>
                <p className="text-xs text-[var(--color-ink-soft)]">{t("tagline")}</p>
              </div>
            </div>

            <button
              onClick={() => setPaletteOpen(true)}
              className="glass mb-6 flex w-full items-center justify-between rounded-2xl px-4 py-2.5 text-xs font-bold text-[var(--color-ink-soft)] transition hover:bg-white/40 hover:text-[var(--color-ink)]"
            >
              <span className="flex items-center gap-2">
                <Search size={14} />
                {tp("placeholder")}
              </span>
              <kbd className="rounded-lg bg-white/40 px-1.5 py-0.5 text-[10px]">Ctrl K</kbd>
            </button>

            <motion.nav
              initial="hidden"
              animate="show"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05, delayChildren: 0.15 } } }}
              className="flex flex-1 flex-col gap-1.5 text-sm font-semibold"
            >
              {nav.map((item) => (
                <motion.div
                  key={item.key}
                  variants={{ hidden: { opacity: 0, x: -14 }, show: { opacity: 1, x: 0, transition: spring } }}
                >
                  <Link
                    href={item.href}
                    prefetch
                    className={`relative flex items-center gap-3 rounded-2xl px-4 py-3 transition-colors ${
                      isActive(item.href)
                        ? "text-[#f6eede]"
                        : "text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
                    }`}
                  >
                    {isActive(item.href) && (
                      <motion.span
                        layoutId="nav-pill"
                        className="absolute inset-0 rounded-2xl bg-[#4a2430] shadow-[0_10px_26px_-12px_rgba(74,36,48,0.55)]"
                        transition={spring}
                      />
                    )}
                    <item.icon
                      size={18}
                      className={`relative z-10 ${isActive(item.href) ? "text-[#f2a9bc]" : ""}`}
                    />
                    <span className="relative z-10">{tn(item.key)}</span>
                  </Link>
                </motion.div>
              ))}
            </motion.nav>

            <div className="mt-4 flex flex-col gap-3">
              {user && (
                <div className="flex items-center gap-3 rounded-2xl bg-white/30 p-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#E8697B] to-[#D94F63] text-sm font-extrabold text-white">
                    {user.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-extrabold">{user.name}</p>
                    <p className="truncate text-[10px] text-[var(--color-ink-soft)]">{user.email}</p>
                  </div>
                  <LogoutButton iconOnly />
                </div>
              )}
              <div className="flex items-center gap-2">
                <NotificationBell />
                <ThemeToggle />
                <div className="flex-1">
                  <LocaleSwitcher />
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* محتوا — با فضای خالی پایین برای داک موبایل */}
        <main className="flex-1 p-5 pb-36 md:p-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* داک شناور موبایل */}
      <DockNav onQuickAdd={() => setPaletteOpen(true)} />

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </MotionConfig>
  );
}