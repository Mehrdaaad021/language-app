/* ── تبدیل میلادی → شمسی (الگوریتم استاندارد، تست‌شده) ── */
export function toJalali(gy: number, gm: number, gd: number): [number, number, number] {
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

/* ── روز اول فروردین یک سال شمسی، به میلادی ── */
function jalaliNewYear(jy: number): [number, number, number] {
  const gy = jy + 621;
  for (const [m, d] of [
    [3, 20],
    [3, 21],
    [3, 22],
  ] as const) {
    const [yj, mj, dj] = toJalali(gy, m, d);
    if (yj === jy && mj === 1 && dj === 1) return [gy, m, d];
  }
  // هرگز به این خط نمی‌رسه (نوروز همیشه ۲۰ تا ۲۲ مارسه)
  return [gy, 3, 21];
}

/* ── تبدیل شمسی → میلادی (مبتنی بر toJalali تست‌شده + شمارش روز) ── */
export function jalaliToGregorian(jy: number, jm: number, jd: number): [number, number, number] {
  const [gy, gm, gd] = jalaliNewYear(jy);

  // چند روز از اول سال شمسی گذشته؟
  const dayOfYear = (jm <= 7 ? (jm - 1) * 31 : 6 * 31 + (jm - 7) * 30) + (jd - 1);

  const base = Date.UTC(gy, gm - 1, gd);
  const target = new Date(base + dayOfYear * 86400000);

  return [target.getUTCFullYear(), target.getUTCMonth() + 1, target.getUTCDate()];
}

/* ── تعداد روزهای ماه شمسی ── */
export function jalaliMonthDays(jy: number, jm: number): number {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  const [gy1, gm1, gd1] = jalaliToGregorian(jy, 1, 1);
  const [gy2, gm2, gd2] = jalaliToGregorian(jy + 1, 1, 1);
  const yearDays = Math.round(
    (Date.UTC(gy2, gm2 - 1, gd2) - Date.UTC(gy1, gm1 - 1, gd1)) / 86400000
  );
  return yearDays - 336;
}

/* ── اعداد فارسی ── */
export function toFa(n: number | string): string {
  return String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
}