import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSiteConfig } from "@/lib/server/config-actions";
import Landing from "@/components/landing/Landing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const fa = locale === "fa";
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");

  const title = fa
    ? "دستیار کلاس زبان | مدیریت کلاس‌های خصوصی"
    : "Language Class Assistant | Private Class Manager";
  const description = fa
    ? "مدیریت شاگردها، جلسات، پرداخت‌ها و دفترچه‌ی مشق دیجیتال کلاس‌های خصوصی زبان."
    : "Manage students, sessions, payments and digital homework notebooks for private language classes.";

  return {
    title,
    description,
    alternates: {
      canonical: `${base}/${locale}`,
      languages: { fa: `${base}/fa`, en: `${base}/en` },
    },
    openGraph: {
      title,
      description,
      url: `${base}/${locale}`,
      siteName: fa ? "دستیار کلاس زبان" : "Language Class Assistant",
      locale: fa ? "fa_IR" : "en_US",
      type: "website",
      images: [
        { url: `${base}/${locale}/opengraph-image`, width: 1200, height: 630 },
      ],
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSession();
  const teachers = await prisma.user.count({ where: { role: "TEACHER" } });
  const all = await getSiteConfig();
  const content = locale === "en" ? all.en : all.fa;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name:
              locale === "fa"
                ? "دستیار کلاس زبان"
                : "Language Class Assistant",
            applicationCategory: "EducationalApplication",
            operatingSystem: "Web",
            description:
              locale === "fa"
                ? "مدیریت شاگردها، جلسات، پرداخت‌ها و دفترچه‌ی مشق دیجیتال کلاس‌های خصوصی زبان."
                : "Manage students, sessions, payments and digital homework notebooks for private language classes.",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "IRR",
            },
          }),
        }}
      />
      <Landing
        role={session?.role ?? null}
        firstRun={teachers === 0}
        content={content}
      />
    </>
  );
}
