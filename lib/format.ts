const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

export function toEnDigits(s: string): string {
  return s.replace(/[۰-۹]/g, (d) => String(FA_DIGITS.indexOf(d)));
}

export function formatNumber(n: number, locale: string): string {
  return new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US").format(n);
}

export function formatDate(iso: string, locale: string, opts?: Intl.DateTimeFormatOptions): string {
  const d = new Date(`${iso}T00:00:00`);
  return new Intl.DateTimeFormat(
    locale === "fa" ? "fa-IR" : "en-US",
    opts ?? { day: "numeric", month: "long" }
  ).format(d);
}

export function formatWeekday(iso: string, locale: string): string {
  return formatDate(iso, locale, { weekday: "short" });
}

export function formatTime(time: string, locale: string): string {
  return new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(`2026-01-01T${time}:00`));
}

export function mapZodErrors(issues: { path: PropertyKey[]; message: string }[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of issues) {
    const first = i.path[0];
    if (typeof first === "string" || typeof first === "number") {
      out[String(first)] = i.message;
    }
  }
  return out;
}