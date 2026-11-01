"use client";

import { useLocale } from "next-intl";
import { toJalali, jalaliToGregorian, jalaliMonthDays, toFa, JALALI_MONTHS_FA } from "@/lib/jalali";

const pad = (n: number) => String(n).padStart(2, "0");

export default function JalaliDateInput({
  value,
  onChange,
}: {
  value: string; // YYYY-MM-DD میلادی
  onChange: (v: string) => void;
}) {
  const locale = useLocale();
  const fa = locale === "fa";

  const hasValue = Boolean(value);
  const [gy, gm, gd] = hasValue ? value.split("-").map(Number) : [0, 0, 0];
  const [jy, jm, jd] = hasValue ? toJalali(gy, gm, gd) : [1405, 8, 1];

  const years: number[] = [];
  for (let y = 1395; y <= 1410; y++) years.push(y);
  const daysInMonth = jalaliMonthDays(jy, jm);
  const days: number[] = [];
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const setJalali = (ny: number, nm: number, nd: number) => {
    const maxD = jalaliMonthDays(ny, nm);
    const safeD = Math.min(nd, maxD);
    const [Y, M, D] = jalaliToGregorian(ny, nm, safeD);
    onChange(`${Y}-${pad(M)}-${pad(D)}`);
  };

  const selectCls =
    "w-full rounded-xl border border-white/40 bg-white/40 px-3 py-2.5 text-sm font-bold outline-none transition focus:border-[#D94F63]";

  return (
    <div className="space-y-2">
      {/* انتخاب شمسی — فقط در فارسی */}
      {fa && (
        <div className="grid grid-cols-3 gap-2">
          <select
            className={selectCls}
            value={jy}
            onChange={(e) => setJalali(Number(e.target.value), jm, jd)}
            aria-label="سال شمسی"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {toFa(y)}
              </option>
            ))}
          </select>
          <select
            className={selectCls}
            value={jm}
            onChange={(e) => setJalali(jy, Number(e.target.value), jd)}
            aria-label="ماه شمسی"
          >
            {JALALI_MONTHS_FA.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
          <select
            className={selectCls}
            value={Math.min(jd, daysInMonth)}
            onChange={(e) => setJalali(jy, jm, Number(e.target.value))}
            aria-label="روز شمسی"
          >
            {days.map((d) => (
              <option key={d} value={d}>
                {toFa(d)}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* input میلادی — همیشه */}
      <input
        type="date"
        className={selectCls}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />

      {/* نمایش معادل — هر دو زبان */}
      {hasValue && (
        <p className="text-[11px] font-bold text-[var(--c-ink-soft)]">
          {fa
            ? `شمسی: ${toFa(jy)}/${toFa(pad(jm))}/${toFa(pad(jd))}  •  میلادی: ${value}`
            : `Jalali: ${jy}/${pad(jm)}/${pad(jd)}  •  Gregorian: ${value}`}
        </p>
      )}
    </div>
  );
}