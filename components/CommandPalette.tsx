"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "@/components/ThemeProvider";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search, LayoutDashboard, GraduationCap, CalendarDays, Wallet, NotebookPen,
  UserPlus, CalendarPlus, CircleDollarSign, Moon, Languages, CornerDownLeft, BarChart3,
} from "lucide-react";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useAppData } from "@/lib/store";

type Item = {
  id: string;
  group: string;
  label: string;
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  run: () => void;
  keywords?: string;
};

export default function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const t = useTranslations("Palette");
  const tn = useTranslations("Nav");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { students } = useAppData();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [open]);

  const items = useMemo<Item[]>(() => {
    const nav: Item[] = [
      { id: "n1", group: t("navigation"), label: tn("dashboard"), icon: LayoutDashboard, run: () => router.push("/dashboard") },
      { id: "n2", group: t("navigation"), label: tn("students"), icon: GraduationCap, run: () => router.push("/students") },
      { id: "n3", group: t("navigation"), label: tn("sessions"), icon: CalendarDays, run: () => router.push("/sessions") },
      { id: "n4", group: t("navigation"), label: tn("payments"), icon: Wallet, run: () => router.push("/payments") },
      { id: "n5", group: t("navigation"), label: tn("notes"), icon: NotebookPen, run: () => router.push("/notes") },
      { id: "n6", group: t("navigation"), label: tn("analytics"), icon: BarChart3, run: () => router.push("/analytics") },
    ];
    const actions: Item[] = [
      { id: "a1", group: t("actions"), label: t("newStudent"), icon: UserPlus, run: () => router.push("/students?new=1") },
      { id: "a2", group: t("actions"), label: t("newSession"), icon: CalendarPlus, run: () => router.push("/sessions?new=1") },
      { id: "a3", group: t("actions"), label: t("newPayment"), icon: CircleDollarSign, run: () => router.push("/payments?new=1") },
      { id: "a4", group: t("actions"), label: t("toggleTheme"), icon: Moon, run: () => setTheme(theme === "light" ? "dark" : "light") },
      { id: "a5", group: t("actions"), label: t("switchLocale"), icon: Languages, run: () => router.replace(pathname, { locale: locale === "fa" ? "en" : "fa" }) },
    ];
    const studs: Item[] = students.map((s) => ({
      id: `s-${s.id}`,
      group: t("students"),
      label: s.name,
      icon: GraduationCap,
      run: () => router.push(`/students/${s.id}`),
      keywords: s.level,
    }));
    return [...nav, ...actions, ...studs];
  }, [t, tn, router, pathname, locale, students, setTheme, theme]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => i.label.toLowerCase().includes(q) || (i.keywords ?? "").toLowerCase().includes(q));
  }, [items, query]);

  useEffect(() => setActive(0), [query]);

  const runItem = (item: Item) => {
    onOpenChange(false);
    item.run();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, filtered.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    if (e.key === "Enter" && filtered[active]) { e.preventDefault(); runItem(filtered[active]); }
    if (e.key === "Escape") onOpenChange(false);
  };

  let lastGroup = "";

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center p-4 pt-[12vh]">
          <motion.button
            aria-label="close"
            className="absolute inset-0 cursor-default bg-[#3A2A2E]/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
          />
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="glass-strong relative w-full max-w-lg overflow-hidden rounded-[24px]"
          >
            <div className="flex items-center gap-3 border-b border-white/40 px-5 py-4">
              <Search size={17} className="text-[var(--color-ink-soft)]" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={t("placeholder")}
                className="w-full bg-transparent text-sm font-medium text-[var(--color-ink)] placeholder:text-[var(--color-ink-soft)]/70 focus:outline-none"
              />
              <kbd className="rounded-lg bg-white/40 px-2 py-1 text-[10px] font-bold text-[var(--color-ink-soft)]">ESC</kbd>
            </div>

            <div className="max-h-[46vh] overflow-y-auto p-2">
              {filtered.length === 0 && (
                <p className="p-6 text-center text-xs font-bold text-[var(--color-ink-soft)]">{t("noResults")}</p>
              )}
              {filtered.map((item, i) => {
                const showGroup = item.group !== lastGroup;
                lastGroup = item.group;
                return (
                  <div key={item.id}>
                    {showGroup && (
                      <p className="px-3 pb-1 pt-3 text-[10px] font-extrabold uppercase tracking-wide text-[var(--color-ink-soft)]">
                        {item.group}
                      </p>
                    )}
                    <button
                      onClick={() => runItem(item)}
                      onMouseEnter={() => setActive(i)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start text-sm font-bold transition ${
                        i === active ? "bg-white/50 text-[var(--color-ink)]" : "text-[var(--color-ink-soft)]"
                      }`}
                    >
                      <item.icon size={16} />
                      <span className="flex-1 truncate">{item.label}</span>
                      {i === active && <CornerDownLeft size={13} className="opacity-60" />}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-4 border-t border-white/40 px-5 py-3 text-[10px] font-bold text-[var(--color-ink-soft)]">
              <span>↑↓ {t("navigate")}</span>
              <span>↵ {t("select")}</span>
              <span>{t("hint")}</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}