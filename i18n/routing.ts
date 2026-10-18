// تنظیمات مسیریابی بین‌المللی — بدون وابستگی به API خاصِ هیچ نسخه‌ای
export const routing = {
  locales: ["fa", "en"],
  defaultLocale: "fa",
  localePrefix: "always",
} as const;

export type Locale = (typeof routing.locales)[number];