import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { ArrowLeft, Calendar, FileText, GraduationCap, Mail, Shield, Smartphone, Sparkles, Users, Wallet } from "lucide-react";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesGrid from "@/components/landing/FeaturesGrid";
import Testimonials from "@/components/landing/Testimonials";
import PricingSection from "@/components/landing/PricingSection";
import CTASection from "@/components/landing/CTASection";

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Landing" });
  const fa = locale === "fa";

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f6eede] via-[#f7ecd9] to-[#f8d8e0]">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-white/20 bg-white/10 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="text-2xl text-[#4a2430]" />
            <span className="text-xl font-extrabold text-[#4a2430]">{t("brand")}</span>
          </div>
          <div className="hidden items-center gap-6 md:flex">
            <a href="#features" className="text-sm font-bold text-[#40222c] hover:text-[#4a2430]">
              {t("navFeatures")}
            </a>
            <a href="#testimonials" className="text-sm font-bold text-[#40222c] hover:text-[#4a2430]">
              {t("testimonialsTitle")}
            </a>
            <a href="#pricing" className="text-sm font-bold text-[#40222c] hover:text-[#4a2430]">
              {t("navPricing")}
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-full px-5 py-2 text-sm font-extrabold text-[#4a2430] transition hover:bg-white/30"
            >
              {t("ctaOpen")}
            </Link>
            <Link
              href="/setup"
              className="btn-primary rounded-full px-5 py-2 text-sm font-extrabold shadow-lg transition"
            >
              {t("ctaStart")}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section با Screenshot */}
      <HeroSection locale={locale} t={t} />

      {/* Trust Bar */}
      <div className="bg-white/20 py-6 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <p className="text-sm font-bold text-[#40222c]">{t("trustText")}</p>
          <div className="mt-4 flex items-center justify-center gap-8 text-2xl font-extrabold text-[#4a2430]">
            <div>
              <div>{t("valTeachers")}</div>
              <div className="text-xs text-[#96707b]">{t("statsTeachers")}</div>
            </div>
            <div>
              <div>{t("valSessions")}</div>
              <div className="text-xs text-[#96707b]">{t("statsSessions")}</div>
            </div>
            <div>
              <div>{t("valNotes")}</div>
              <div className="text-xs text-[#96707b]">{t("statsNotes")}</div>
            </div>
            <div>
              <div>{t("valUptime")}</div>
              <div className="text-xs text-[#96707b]">{t("statsUptime")}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <FeaturesGrid locale={locale} t={t} />

      {/* Testimonials */}
      <Testimonials locale={locale} t={t} />

      {/* Pricing */}
      <PricingSection locale={locale} t={t} />

      {/* CTA */}
      <CTASection locale={locale} t={t} />

      {/* Footer */}
      <footer className="bg-[#4a2430] py-8 text-center text-sm text-white/80">
        <p>© 2026 {t("brand")}. {t("footerRights")}</p>
        <p className="mt-2 text-xs text-white/60">{t("footerMade")}</p>
      </footer>
    </div>
  );
}