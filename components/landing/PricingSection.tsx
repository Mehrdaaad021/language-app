import { Check } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { AbstractIntlMessages } from "next-intl";

export default function PricingSection({
  locale,
  t,
}: {
  locale: string;
  t: (key: string) => string & { raw?: never };
}) {
  const plans = [
    { name: "planFree", price: "priceFree", desc: "freeDesc", features: "freeFeatures", popular: false },
    { name: "planPro", price: "pricePro", desc: "proDesc", features: "proFeatures", popular: true },
    { name: "planStudio", price: "priceStudio", desc: "studioDesc", features: "studioFeatures", popular: false },
  ];

  return (
    <section id="pricing" className="py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-extrabold text-[#4a2430]">{t("pricingTitle")}</h2>
          <p className="mt-3 text-lg text-[#96707b]">{t("pricingSub")}</p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {plans.map((plan, i) => (
            <div
              key={i}
              className={`glass-strong relative rounded-3xl p-8 shadow-xl transition hover:scale-105 ${
                plan.popular ? "ring-4 ring-[#d94f63]" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#d94f63] to-[#c2586b] px-6 py-2 text-xs font-extrabold text-white shadow-lg">
                  {t("popular")}
                </div>
              )}

              <h3 className="mb-2 text-2xl font-extrabold text-[#4a2430]">{t(plan.name)}</h3>
              <p className="mb-6 text-sm text-[#96707b]">{t(plan.desc)}</p>

              <div className="mb-6">
                <span className="text-4xl font-extrabold text-[#4a2430]">{t(plan.price)}</span>
              </div>

              <ul className="mb-8 space-y-3">
                {featuresFor(t, plan.features).map((feature, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-[#40222c]">
                    <Check size={18} className="mt-0.5 shrink-0 text-[#d94f63]" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/setup"
                className={`block w-full rounded-full py-3 text-center text-sm font-extrabold transition ${
                  plan.popular
                    ? "btn-primary shadow-lg hover:scale-105"
                    : "border-2 border-[#4a2430] text-[#4a2430] hover:bg-white/30"
                }`}
              >
                {t("choosePlan")}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── خوندن آرایه از translations با fallback امن ── */
function featuresFor(t: unknown, key: string): string[] {
  const tr = t as { raw?: (k: string) => unknown };
  try {
    const raw = tr.raw?.(key);
    if (Array.isArray(raw)) return raw as string[];
  } catch {
    // fallback
  }
  return [];
}