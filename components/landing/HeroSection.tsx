import { ArrowLeft, Sparkles } from "lucide-react";
import { Link } from "@/i18n/navigation";
import Image from "next/image";

export default function HeroSection({
  locale,
  t,
}: {
  locale: string;
  t: (key: string) => string;
}) {
  const fa = locale === "fa";

  return (
    <section className="relative overflow-hidden px-6 pb-16 pt-20">
      <div className="mx-auto max-w-7xl">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* متن */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/40 px-4 py-2 text-sm font-extrabold text-[#4a2430] backdrop-blur-sm">
              <Sparkles size={16} />
              {t("heroBadge")}
            </div>

            <h1 className="text-5xl font-extrabold leading-tight text-[#4a2430] md:text-6xl">
              {t("heroTitle1")}
              <span className="block bg-gradient-to-r from-[#d94f63] to-[#c2586b] bg-clip-text text-transparent">
                {t("heroTitle2")}
              </span>
            </h1>

            <p className="text-lg leading-relaxed text-[#40222c]">{t("heroSub")}</p>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/setup"
                className="btn-primary flex items-center gap-2 rounded-full px-8 py-4 text-base font-extrabold shadow-xl transition hover:scale-105"
              >
                {t("ctaStart")}
                <ArrowLeft className={fa ? "" : "rotate-180"} size={20} />
              </Link>
              <Link
                href="/students"
                className="rounded-full border-2 border-[#4a2430] px-8 py-4 text-base font-extrabold text-[#4a2430] transition hover:bg-white/30"
              >
                {t("ctaDemo")}
              </Link>
            </div>
          </div>

          {/* اسکرین‌شات */}
          <div className="relative">
            <div className="absolute -inset-4 rounded-[40px] bg-white/30 blur-2xl" />
            <div className="relative overflow-hidden rounded-3xl border-4 border-white/40 shadow-2xl">
              <Image
                src="/images/dashboard-hero.png"
                alt="Dashboard Preview"
                width={800}
                height={600}
                className="w-full"
                priority
              />
            </div>

            <div className="absolute -bottom-4 -right-4 rounded-2xl bg-white/90 p-4 shadow-xl backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#d94f63] to-[#c2586b] text-white">
                  <Sparkles size={24} />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#96707b]">
                    {fa ? "۱۰۰٪ رایگان" : "100% Free"}
                  </div>
                  <div className="text-sm font-extrabold text-[#4a2430]">
                    {fa ? "شروع کن" : "Get Started"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}