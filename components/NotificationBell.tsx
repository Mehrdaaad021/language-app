"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, CalendarClock, Wallet } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getTeacherNotifications, type AppNotification } from "@/lib/server/notifications";
import { useToast } from "@/components/ui/Toast";

export default function NotificationBell({ compact = false }: { compact?: boolean }) {
  const t = useTranslations("Notifications");
  const toast = useToast();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);
  const known = useRef<Set<string> | null>(null);

  const load = async (silent: boolean) => {
    try {
      const next = await getTeacherNotifications();
      if (known.current === null) {
        known.current = new Set(next.map((n) => n.id));
      } else {
        const fresh = next.filter((n) => !known.current!.has(n.id));
        known.current = new Set(next.map((n) => n.id));
        if (!silent && fresh.length > 0) toast(t("newArrived", { count: fresh.length }));
      }
      setItems(next);
    } catch {
      /* silent */
    }
  };

  useEffect(() => {
    load(true);
    const iv = setInterval(() => load(false), 20000);
    const onFocus = () => load(false);
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(iv);
      window.removeEventListener("focus", onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={t("bell")}
        className={`glass relative flex shrink-0 items-center justify-center rounded-xl text-[var(--color-ink-soft)] transition hover:bg-white/40 hover:text-[var(--color-ink)] ${
          compact ? "h-9 w-9" : "h-10 w-10"
        }`}
      >
        <Bell size={compact ? 15 : 17} />
        {items.length > 0 && (
          <motion.span
            key={items.length}
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            style={{ height: 18, minWidth: 18 }}
            className="absolute -end-1 -top-1 flex items-center justify-center rounded-full bg-[#D94F63] px-1 text-[9px] font-extrabold text-white"
          >
            {items.length}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <button
              className="fixed inset-0 z-40 cursor-default"
              aria-label="close"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="glass-strong absolute z-50 w-80 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl p-2 top-12 end-0 md:top-auto md:bottom-12 md:end-auto md:start-0"
            >
              <p className="px-3 py-2 text-[10px] font-extrabold uppercase tracking-wide text-[var(--color-ink-soft)]">
                {t("bell")}
              </p>
              {items.length === 0 ? (
                <p className="p-6 text-center text-xs font-bold text-[var(--color-ink-soft)]">{t("empty")}</p>
              ) : (
                <ul className="flex max-h-72 flex-col gap-1 overflow-y-auto">
                  {items.map((n) => (
                    <li key={n.id}>
                      <Link
                        href={n.href}
                        onClick={() => setOpen(false)}
                        className="flex items-start gap-3 rounded-xl px-3 py-2.5 text-start transition hover:bg-white/30"
                      >
                        <span
                          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                            n.kind === "session"
                              ? "bg-[rgba(214,142,60,0.18)] text-[#8A5A22]"
                              : "bg-[rgba(217,79,99,0.14)] text-[#B23A4C]"
                          }`}
                        >
                          {n.kind === "session" ? <CalendarClock size={15} /> : <Wallet size={15} />}
                        </span>
                        <span className="text-xs font-bold leading-6">{t(n.titleKey, { name: n.name })}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}