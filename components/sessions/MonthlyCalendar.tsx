"use client";

import { useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

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

/* ── تبدیل میلادی → شمسی ── */
function toJalali(gy: number, gm: number, gd: number): [number, number, number] {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days =
    355666 +
    365 * gy +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) +
    gd +
    g_d_m[gm - 1];
  let jy = -1595 + 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  const jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
  return [jy, jm, jd];
}

/* ── تبدیل شمسی → میلادی ── */
function jalaliToGregorian(jy: number, jm: number, jd: number): [number, number, number] {
  const jy2 = jy - 979;
  const jm2 = jm - 1;
  const jd2 = jd - 1;
  let jdn =
    365 * jy2 +
    Math.floor(jy2 / 33) * 8 +
    Math.floor(((jy2 % 33) + 3) / 4) +
    30 * jm2 +
    Math.min(jm2, 6) +
    jd2;
  jdn += 2794545;
  const l = jdn + 68569;
  const n = Math.floor((4 * l) / 146097);
  let l2 = l - Math.floor((146097 * n + 3) / 4);
  const i = Math.floor((4000 * (l2 + 1)) / 1461001);
  l2 = l2 - Math.floor((1461 * i) / 4) + 31;
  const j = Math.floor((80 * l2) / 2447);
  const gd = l2 - Math.floor((2447 * j) / 80);
  l2 = Math.floor(j / 11);
  const gm = j + 2 - 12 * l2;
  const gy = 100 * (n - 49) + i + l2;
  return [gy, gm, gd];
}

/* ── تعداد روزهای ماه شمسی (محاسبه‌ی مطمئن از روی تقویم میلادی) ── */
function jalaliMonthDays(jy: number, jm: number): number {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  const [gy1, gm1, gd1] = jalaliToGregorian(jy, 1, 1);
  const [gy2, gm2, gd2] = jalaliToGregorian(jy + 1, 1, 1);
  const yearDays = Math.round(
    (Date.UTC(gy2, gm2 - 1, gd2) - Date.UTC(gy1, gm1 - 1, gd1)) / 86400000
  );
  return yearDays - 336; // ۶×۳۱ + ۵×۳۰ = ۳۳۶
}

function toFa(n: number | string): string {
  return String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
}

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
          <div key={i} className="py-2 text-center text-[10px] font-extrabold text-[var(--c-ink-soft)]">
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