import { Calendar, FileText, Mail, Shield, Smartphone, Users, Wallet } from "lucide-react";

export default function FeaturesGrid({
  locale,
  t,
}: {
  locale: string;
  t: (key: string) => string;
}) {
  const features = [
    { icon: Users, title: "f1t", desc: "f1d" },
    { icon: FileText, title: "f2t", desc: "f2d" },
    { icon: Calendar, title: "f3t", desc: "f3d" },
    { icon: Mail, title: "f4t", desc: "f4d" },
    { icon: Shield, title: "f5t", desc: "f5d" },
    { icon: Smartphone, title: "f6t", desc: "f6d" },
  ];

  return (
    <section id="features" className="py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-extrabold text-[#4a2430]">{t("featuresTitle")}</h2>
          <p className="mt-3 text-lg text-[#96707b]">{t("featuresSub")}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div
                key={i}
                className="glass-strong group rounded-3xl p-6 transition hover:scale-105 hover:shadow-2xl"
              >
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#f8d8e0] to-[#f6e7c6] text-[#4a2430] transition group-hover:scale-110">
                  <Icon size={28} />
                </div>
                <h3 className="mb-2 text-lg font-extrabold text-[#4a2430]">
                  {t(feature.title)}
                </h3>
                <p className="text-sm leading-relaxed text-[#40222c]">{t(feature.desc)}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}