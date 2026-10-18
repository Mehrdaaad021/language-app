import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async (ctx) => {
  const c = ctx as { requestLocale?: Promise<string | undefined>; locale?: string };
  const requested = (await c.requestLocale) ?? c.locale;

  const locale = (routing.locales as readonly string[]).includes(requested ?? "")
    ? (requested as "fa" | "en")
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});