"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Bell, CheckCheck } from "lucide-react";
import { getTeacherNotifications, type AppNotification } from "@/lib/server/notifications";

function readLS(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(key) ?? "[]") as string[];
  } catch {
    return [];
  }
}

const PANEL_W = 288;

type PanelPos = { left: number; top?: number; bottom?: number };

export default function NotificationBell({ compact }: { compact?: boolean }) {
  const t = useTranslations("Notifications");
  const btnRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<PanelPos | null>(null);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [readIds, setReadIds] = useState<string[]>(() => readLS("lca_notif_read"));

  const load = async () => {
    try {
      const list = await getTeacherNotifications();
      setItems(list);

      const shown = readLS("lca_notif_shown");
      const fresh = list.filter((n) => !shown.includes(n.id));
      if (
        fresh.length > 0 &&
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        fresh.slice(0, 3).forEach((n) =>
          new Notification(t("newArrived", { count: String(fresh.length) }), { body: n.message })
        );
      }
      if (typeof window !== "undefined" && fresh.length > 0) {
        window.localStorage.setItem("lca_notif_shown", JSON.stringify([...shown, ...fresh.map((f) => f.id)]));
      }
    } catch {
      // بی‌صدا
    }
  };

  useEffect(() => {
    load();
    const iv = setInterval(load, 60_000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const unread = items.filter((i) => !readIds.includes(i.id)).length;

  const toggle = async () => {
    if (open) {
      setOpen(false);
      return;
    }
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // افقی: وسط دکمه، ولی همیشه داخل صفحه
      const left = Math.min(Math.max(r.left + r.width / 2 - PANEL_W / 2, 8), vw - PANEL_W - 8);

      // عمودی: اگه پایین جا نیست، بالا باز شو
      const openUp = r.bottom + 360 > vh;
      setPos(
        openUp
          ? { left, bottom: vh - r.top + 8 }
          : { left, top: r.bottom + 8 }
      );
    }
    setOpen(true);
  };

  const markAll = () => {
    const ids = items.map((i) => i.id);
    setReadIds(ids);
    if (typeof window !== "undefined") window.localStorage.setItem("lca_notif_read", JSON.stringify(ids));
  };

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        aria-label={t("bell")}
        className={`glass relative flex items-center justify-center rounded-xl transition hover:bg-white/40 ${compact ? "h-9 w-9" : "h-10 w-10"}`}
      >
        <Bell size={compact ? 15 : 17} />
        {unread > 0 && (
          <span className="absolute -end-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gradient-to-b from-[#E8697B] to-[#D94F63] px-1 text-[9px] font-extrabold text-white">
            {unread}
          </span>
        )}
      </button>

      {open && pos && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="glass-strong fixed z-50 rounded-2xl p-3 shadow-2xl"
            style={{ left: pos.left, top: pos.top, bottom: pos.bottom, width: PANEL_W }}
          >
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-extrabold">{t("bell")}</p>
              {items.length > 0 && (
                <button
                  type="button"
                  onClick={markAll}
                  className="flex items-center gap-1 rounded-lg bg-white/30 px-2 py-1 text-[10px] font-extrabold transition hover:bg-white/40"
                >
                  <CheckCheck size={11} />
                  ✓
                </button>
              )}
            </div>
            {items.length === 0 ? (
              <p className="py-6 text-center text-xs text-[var(--color-ink-soft)]">{t("empty")}</p>
            ) : (
              <div className="flex max-h-72 flex-col gap-2 overflow-y-auto">
                {items.map((n) => {
                  const isRead = readIds.includes(n.id);
                  return (
                    <div key={n.id} className={`rounded-xl p-2.5 ${isRead ? "bg-white/15 opacity-60" : "bg-white/30"}`}>
                      <p className="text-[11px] font-bold leading-5">{n.message}</p>
                      <p className="mt-1 text-[9px] text-[var(--color-ink-soft)]">
                        {new Date(n.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}