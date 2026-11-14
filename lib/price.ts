const FA = "۰۱۲۳۴۵۶۷۸۹";
const toEnDigits = (s: string) => s.replace(/[۰-۹]/g, (d) => String(FA.indexOf(d)));

export function formatPriceBoth(price: string): { fa: string; en: string } {
  const normalized = toEnDigits(price);
  const digits = normalized.replace(/\D/g, "");
  if (!digits) return { fa: price, en: price };

  const num = parseInt(digits, 10);
  const firstIdx = normalized.search(/\d/);
  const prefix = price.slice(0, firstIdx).trim();
  const suffix = price.slice(firstIdx + digits.length).trim();

  const en = new Intl.NumberFormat("en-US").format(num);
  const fa = new Intl.NumberFormat("fa-IR").format(num);

  const wrap = (v: string) => `${prefix ? prefix + " " : ""}${v}${suffix ? " " + suffix : ""}`;
  return { fa: wrap(fa), en: wrap(en) };
}