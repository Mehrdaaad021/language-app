"use client";

import { useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
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

export default function MonthlyCalendar({
  sessions,
  onAddSession,
}: {
  sessions: Session[];
  onAddSession?: (date: string) => void;
}) {
  const locale = useLocale();
  const fa = locale === "fa";

  /* ── وضعیت اولیه: امروز با تقویم درستِ هر زبان ── */
  const [view, setView] = useState(() => {
    const now = new Date();
    if (fa) {
      const [jy, jm] = toJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
      return { year: jy, month: jm };
    }
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });

  const { daysInMonth, firstWeekday } = useMemo(() => {
    if (fa) {
      const [gy, gm, gd] = jalaliToGregorian(view.year, view.month, 1);
      const wd = (new Date(gy, gm - 1, gd).getDay() + 1) % 7; // شنبه = ۰
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
    setView((v) =>
      v.month === 1 ? { year: v.year - 1, month: 12 } : { ...v, month: v.month - 1 }
    );
  const next = () =>
    setView((v) =>
      v.month === 12 ? { year: v.year + 1, month: 1 } : { ...v, month: v.month + 1 }
    );
  const goToday = () => {
    const now = new Date();
    if (fa) {
      const [jy, jm] = toJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
      setView({ year: jy, month: jm });
    } else {
      setView({ year: now.getFullYear(), month: now.getMonth() + 1 });
    }
  };

  const monthLabel = fa
    ? `${MONTHS_FA[view.month - 1]} ${toFa(view.year)}`
    : `${MONTHS_EN[view.month - 1]} ${view.year}`;

  const now = new Date();
  const todayYMD = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <Card>
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

      <div className="grid grid-cols-7 gap-1">
        {(fa ? WEEKDAYS_FA : WEEKDAYS_EN).map((w, i) => (
          <div
            key={i}
            className="py-2 text-center text-[10px] font-extrabold text-[var(--c-ink-soft)]"
          >
            {w}
          </div>
        ))}

        {cells.map((d, i) => {
          if (d === null) return <div key={i} />;
          const ymd = fa
            ? (() => {
                const [gy, gm, gd] = jalaliToGregorian(view.year, view.month, d);
                return `${gy}-${String(gm).padStart(2, "0")}-${String(gd).padStart(2, "0")}`;
              })()
            : `${view.year}-${String(view.month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const daySessions = sessionsByDate[ymd] ?? [];
          const isToday = ymd === todayYMD;

          return (
            <button
              key={i}
              type="button"
              onClick={() => onAddSession?.(ymd)}
              className={`relative flex aspect-square flex-col items-center justify-start rounded-xl p-1 text-xs transition hover:bg-[var(--c-surface-2)] ${
                isToday ? "bg-[var(--c-pink)] ring-1 ring-[var(--c-primary)]" : ""
              }`}
            >
              <span className={`font-extrabold ${isToday ? "text-[var(--c-primary)]" : ""}`}>
                {fa ? toFa(d) : d}
              </span>
              {daySessions.length > 0 && (
                <span className="absolute bottom-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--c-primary)] px-1 text-[9px] font-extrabold text-[var(--c-on-primary)]">
                  {fa ? toFa(daySessions.length) : daySessions.length}
                </span>
              )}
              {daySessions.length === 0 && isToday && (
                <Plus size={10} className="mt-auto text-[var(--c-primary)]" />
              )}
            </button>
          );
        })}
      </div>
    </Card>
  );
}