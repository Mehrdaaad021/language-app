"use client";

import React, { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Home, Users, Calendar, Wallet, FileText, BarChart3,
  Palette, Languages, PlusCircle, Settings, type LucideIcon,
} from "lucide-react";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useAppData } from "@/lib/store";
import { useFocusTrap } from "@/lib/useFocusTrap";

type Item = {
  id: string;
  group: string;
  label: string;
  icon: LucideIcon;
  run: () => void;
};

export default function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const t = useTranslations("Palette");
  const router = useRouter();
  const pathname = usePathname();
  const { data, loading } = useAppData();
  const [q, setQ] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  useFocusTrap(panelRef, open, () => onOpenChange(false));

  const students = data?.students ?? [];

  const items = useMemo<Item[]>(() => {
    if (loading) return [];
    return [
      { id: "n1", group: t("navigation"), label: "Dashboard", icon: Home, run: () => router.push("/dashboard") },
      { id: "n2", group: t("navigation"), label: "Students", icon: Users, run: () => router.push("/students") },
      { id: "n3", group: t("navigation"), label: "Sessions", icon: Calendar, run: () => router.push("/sessions") },
      { id: "n4", group: t("navigation"), label: "Payments", icon: Wallet, run: () => router.push("/payments") },
      { id: "n5", group: t("navigation"), label: "Notes", icon: FileText, run: () => router.push("/notes") },
      { id: "n6", group: t("navigation"), label: "Analytics", icon: BarChart3, run: () => router.push("/analytics") },
      { id: "n7", group: t("navigation"), label: "Settings", icon: Settings, run: () => router.push("/settings") },
      { id: "a1", group: t("actions"), label: t("newStudent"), icon: PlusCircle, run: () => router.push("/students") },
      { id: "a2", group: t("actions"), label: t("newSession"), icon: PlusCircle, run: () => router.push("/sessions") },
      { id: "a3", group: t("actions"), label: t("newPayment"), icon: PlusCircle, run: () => router.push("/payments") },
      { id: "a4", group: t("actions"), label: t("toggleTheme"), icon: Palette, run: () => document.documentElement.classList.toggle("dark") },
      { id: "a5", group: t("actions"), label: t("switchLocale"), icon: Languages, run: () => router.replace(pathname, { locale: pathname.startsWith("/fa") ? "en" : "fa" }) },
    ];
  }, [loading, t, router, pathname]);

  const studs: Item[] = students.map((s) => ({
    id: `s-${s.id}`,
    group: t("students"),
    label: s.name,
    icon: Users,
    run: () => router.push(`/students/${s.id}`),
  }));

  const all = [...items, ...studs];
  const filtered = q
    ? all.filter((i) => i.label.toLowerCase().includes(q.toLowerCase()))
    : all;

  const run = (it: Item) => {
    onOpenChange(false);
    setQ("");
    setActiveIdx(0);
    it.run();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => (i + 1) % Math.max(filtered.length, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => (i - 1 + filtered.length) % Math.max(filtered.length, 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const it = filtered[activeIdx];
      if (it) run(it);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 p-4 backdrop-blur-sm"
          onClick={() => onOpenChange(false)}
        >
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={t("placeholder")}
            initial={{ opacity: 0, y: -20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-strong mt-24 w-full max-w-xl rounded-[24px] p-2 shadow-2xl outline-none"
          >
            <div className="flex items-center gap-3 px-4 py-3">
              <Search size={16} className="text-[var(--c-ink-soft)]" />
              <input
                autoFocus
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setActiveIdx(0);
                }}
                onKeyDown={onKeyDown}
                placeholder={t("placeholder")}
                aria-label={t("placeholder")}
                className="flex-1 bg-transparent text-sm font-medium outline-none"
              />
              <kbd className="rounded-md bg-white/40 px-2 py-0.5 text-[10px] font-extrabold">Esc</kbd>
            </div>

            <div className="max-h-[50vh] overflow-y-auto px-2 pb-2">
              {filtered.length === 0 ? (
                <p className="px-4 py-8 text-center text-xs text-[var(--c-ink-soft)]">
                  {t("noResults")}
                </p>
              ) : (
                Object.entries(
                  filtered.reduce<Record<string, Item[]>>((acc, it) => {
                    (acc[it.group] ||= []).push(it);
                    return acc;
                  }, {})
                ).map(([group, list]) => (
                  <div key={group} className="py-1">
                    <p className="px-4 py-2 text-[10px] font-extrabold uppercase tracking-wider text-[var(--c-ink-soft)]">
                      {group}
                    </p>
                    {list.map((it) => {
                      const idx = filtered.indexOf(it);
                      const active = idx === activeIdx;
                      return (
                        <button
                          key={it.id}
                          onClick={() => run(it)}
                          onMouseEnter={() => setActiveIdx(idx)}
                          className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                            active ? "bg-[var(--c-surface-2)]" : ""
                          }`}
                        >
                          <it.icon size={16} className="shrink-0 text-[var(--c-ink-soft)]" />
                          <span className="flex-1 text-start">{it.label}</span>
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}