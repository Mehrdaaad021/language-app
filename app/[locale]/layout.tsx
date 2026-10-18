import type { Metadata } from "next";
import Script from "next/script";
import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { routing, type Locale } from "@/i18n/routing";
import { AppDataProvider } from "@/lib/store";
import { ToastProvider } from "@/components/ui/Toast";
import { CustomThemeProvider } from "@/components/ThemeProvider";
import PwaRegistrar from "@/components/PwaRegistrar";
import "../globals.css";

const META: Record<Locale, Metadata> = {
  fa: { title: "دستیار کلاس زبان", description: "مدیریت دیجیتال کلاس‌های خصوصی زبان" },
  en: { title: "Language Class Assistant", description: "Digital management for private language classes" },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return META[locale as Locale] ?? META.fa;
}

export default async function LocaleLayout({ params, children }: { params: Promise<{ locale: string }>; children: ReactNode }) {
  const { locale } = await params;
  if (!(routing.locales as readonly string[]).includes(locale)) notFound();

  const messages = (await import(`../../messages/${locale}.json`)).default;
  const dir = locale === "fa" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css" />
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme') || 'system';
                const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                if (isDark) document.documentElement.classList.add('dark');
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="antialiased">
        <PwaRegistrar />
        <CustomThemeProvider>
          <NextIntlClientProvider messages={messages}>
            <ToastProvider>
              <AppDataProvider>{children}</AppDataProvider>
            </ToastProvider>
          </NextIntlClientProvider>
        </CustomThemeProvider>
      </body>
    </html>
  );
}