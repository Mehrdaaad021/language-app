"use client";

import { useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { toJalali, jalaliToGregorian, jalaliMonthDays, toFa } from "@/lib/jalali";

type Session = {
  id: string;
  studentName: string;
  date: string; // YYYY-MM-DD
  time: string;
  topic: string;
  status: "upcoming" | "completed" | "cancelled";
};

const WEEKDAYS_FA = ["ش", "ی", "د", "س", "چ", "پ", "ج"];
const WEEKDAYS_EN = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS_FA = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
];
const MONTHS_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/* ── رنگ وضعیت جلسات (color-coded مثل Calendly) ── */
const STATUS_COLOR: Record<Session["status"], string> = {
  upcoming: "#d94f63",
  completed: "#2f9e6e",
  cancelled: "#b39aa2",
};

export default function MonthlyCalendar({
  sessions,
  onAddSession,
}: {
  sessions: Session[];
  onAddSession?: (date: string) => void;
}) {
  const locale = useLocale();
  const fa = locale === "fa";

  const [view, setView] = useState(() => {
    const now = new Date();
    if (fa) {
      const [jy, jm] = toJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
      return { year: jy, month: jm };
    }
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });

  const [selected, setSelected] = useState<string | null>(null);

  const { daysInMonth, firstWeekday } = useMemo(() => {
    if (fa) {
      const [gy, gm, gd] = jalaliToGregorian(view.year, view.month, 1);
      const wd = (new Date(gy, gm - 1, gd).getDay() + 1) % 7;
      return { daysInMonth: jalaliMonthDays(view.year, view.month), firstWeekday: wd };
    }
    return {
      daysInMonth: new Date(view.year, view.month, 0).getDate(),
      firstWeekday: new Date(view.year, view.month - 1, 1).getDay(),
    };
  }, [fa, view.year, view.month]);

  const sessionsByDate = useMemo(() => {
    const map: Record<string, Session[]> = {};
    sessions.forEach((s) => {
      (map[s.date] ||= []).push(s);
    });
    return map;
  }, [sessions]);

  const prev = () =>
    setView((v) => (v.month === 1 ? { year: v.year - 1, month: 12 } : { ...v, month: v.month - 1 }));
  const next = () =>
    setView((v) => (v.month === 12 ? { year: v.year + 1, month: 1 } : { ...v, month: v.month + 1 }));
  const goToday = () => {
    const now = new Date();
    if (fa) {
      const [jy, jm] = toJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
      setView({ year: jy, month: jm });
    } else {
      setView({ year: now.getFullYear(), month: now.getMonth() + 1 });
    }
    setSelected(null);
  };

  const monthLabel = fa
    ? `${MONTHS_FA[view.month - 1]} ${toFa(view.year)}`
    : `${MONTHS_EN[view.month - 1]} ${view.year}`;

  const now = new Date();
  const todayYMD = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const ymdOf = (d: number) =>
    fa
      ? (() => {
          const [gy, gm, gd] = jalaliToGregorian(view.year, view.month, d);
          return `${gy}-${String(gm).padStart(2, "0")}-${String(gd).padStart(2, "0")}`;
        })()
      : `${view.year}-${String(view.month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const selectedSessions = selected ? sessionsByDate[selected] ?? [] : [];

  const selectedLabel = selected
    ? fa
      ? (() => {
          const [y, m, d] = selected.split("-").map(Number);
          const [jy, jm, jd] = toJalali(y, m, d);
          return `${jd} ${MONTHS_FA[jm - 1]} ${jy}`;
        })().replace(/\d/g, (x) => toFa(x))
      : selected
    : "";

  return (
    <Card>
      {/* هدر تقویم */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={prev} aria-label="prev month">
            {fa ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </Button>
          <h3 className="min-w-[140px] text-center text-base font-extrabold">{monthLabel}</h3>
          <Button variant="ghost" onClick={next} aria-label="next month">
            {fa ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </Button>
        </div>
        <Button variant="glass" onClick={goToday}>
          {fa ? "امروز" : "Today"}
        </Button>
      </div>

      {/* راهنمای رنگ‌ها */}
      <div className="mb-3 flex items-center gap-4 text-[10px] font-bold text-[var(--c-ink-soft)]">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: STATUS_COLOR.upcoming }} />
          {fa ? "پیش رو" : "Upcoming"}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: STATUS_COLOR.completed }} />
          {fa ? "برگزار شده" : "Completed"}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: STATUS_COLOR.cancelled }} />
          {fa ? "لغو شده" : "Cancelled"}
        </span>
      </div>

      {/* شبکه‌ی روزها */}
      <div className="grid grid-cols-7 gap-1">
        {(fa ? WEEKDAYS_FA : WEEKDAYS_EN).map((w, i) => (
          <div key={i} className="py-2 text-center text-[10px] font-extrabold text-[var(--c-ink-soft)]">
            {w}
          </div>
        ))}

        {cells.map((d, i) => {
          if (d === null) return <div key={i} />;
          const ymd = ymdOf(d);
          const daySessions = sessionsByDate[ymd] ?? [];
          const isToday = ymd === todayYMD;
          const isSelected = ymd === selected;

          return (
            <button
              key={i}
              type="button"
              onClick={() => setSelected(isSelected ? null : ymd)}
              className={`relative flex aspect-square flex-col items-center justify-center gap-1 rounded-xl p-1 text-xs transition hover:bg-[var(--c-surface-2)] ${
                isSelected ? "bg-[var(--c-surface-2)] ring-2 ring-[var(--c-primary)]" : ""
              } ${isToday && !isSelected ? "bg-[var(--c-pink)]" : ""}`}
            >
              <span className={`font-extrabold ${isToday ? "text-[var(--c-primary)]" : ""}`}>
                {fa ? toFa(d) : d}
              </span>
              {/* نقطه‌های رنگی رویدادها */}
              {daySessions.length > 0 && (
                <span className="flex gap-0.5">
                  {daySessions.slice(0, 3).map((s) => (
                    <span
                      key={s.id}
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: STATUS_COLOR[s.status] }}
                    />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* پنل جزئیات روز انتخاب‌شده (click to expand) */}
      {selected && (
        <div className="mt-4 rounded-2xl bg-[var(--c-surface-2)] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-extrabold">{selectedLabel}</h4>
            <button
              type="button"
              onClick={() => setSelected(null)}
              aria-label={fa ? "بستن" : "Close"}
              className="rounded-lg p-1 transition hover:bg-white/40"
            >
              <X size={16} />
            </button>
          </div>

          {selectedSessions.length === 0 ? (
            <p className="py-2 text-center text-xs text-[var(--c-ink-soft)]">
              {fa ? "جلسه‌ای در این روز نیست." : "No sessions on this day."}
            </p>
          ) : (
            <div className="space-y-2">
              {selectedSessions.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-xl bg-[var(--c-surface)] p-3"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="h-8 w-1 rounded-full"
                      style={{ background: STATUS_COLOR[s.status] }}
                    />
                    <div>
                      <p className="text-sm font-extrabold">{s.studentName}</p>
                      <p className="text-[11px] text-[var(--c-ink-soft)]">{s.topic || "—"}</p>
                    </div>
                  </div>
                  <span className="rounded-lg bg-[var(--c-surface-2)] px-2 py-1 text-[10px] font-extrabold tabular-nums">
                    {fa ? toFa(s.time) : s.time}
                  </span>
                </div>
              ))}
            </div>
          )}

          {onAddSession && (
            <button
              type="button"
              onClick={() => onAddSession(selected)}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-white/50 py-2 text-xs font-extrabold text-[var(--c-primary)] transition hover:bg-white/70"
            >
              <Plus size={14} />
              {fa ? "افزودن جلسه در این روز" : "Add session on this day"}
            </button>
          )}
        </div>
      )}
    </Card>
  );
}