import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";

export default function CTASection({
  locale,
  t,
}: {
  locale: string;
  t: (key: string) => string;
}) {
  const fa = locale === "fa";

  return (
    <section className="bg-gradient-to-r from-[#d94f63] to-[#c2586b] py-20 text-white">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <h2 className="mb-4 text-4xl font-extrabold md:text-5xl">{t("ctaTitle")}</h2>
        <p className="mb-8 text-lg opacity-90">{t("ctaSub")}</p>
        <Link
          href="/setup"
          className="inline-flex items-center gap-2 rounded-full bg-white px-10 py-4 text-base font-extrabold text-[#4a2430] shadow-2xl transition hover:scale-105"
        >
          {t("ctaStart")}
          <ArrowLeft className={fa ? "" : "rotate-180"} size={20} />
        </Link>
      </div>
    </section>
  );
}