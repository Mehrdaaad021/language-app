import { notFound } from "next/navigation";
import { getPublicLandingBySlug } from "@/lib/server/landing-actions";
import { Star, Check, Mail } from "lucide-react";
import BookingButton from "@/components/landing/BookingButton";
import { formatPriceBoth } from "@/lib/price";
export default async function TeacherLandingPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const fa = locale === "fa";
  const d = await getPublicLandingBySlug(slug);
  if (!d) notFound();

  const accent = d.accentColor || "#D94F63";

  return (
    <main dir={fa ? "rtl" : "ltr"} className="min-h-screen bg-[#f6eede] text-[#40222c]">
      {/* Hero */}
      <section className="relative overflow-hidden px-6 py-20 text-center md:py-28">
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full blur-3xl" style={{ background: accent, opacity: 0.18 }} />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full blur-3xl" style={{ background: accent, opacity: 0.12 }} />
        <span className="chip-lux mx-auto bg-white/70" style={{ color: accent }}>
          {d.heroBadge}
        </span>
        <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-extrabold leading-tight md:text-5xl">
          {d.heroTitle1} <span style={{ color: accent }}>{d.heroTitle2}</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-[#7c5a63] md:text-base">{d.heroSub}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <BookingButton slug={slug} label={d.ctaPrimary} accent={accent} />
          <a href="#pricing" className="rounded-full bg-white/70 px-7 py-3 text-sm font-extrabold" style={{ color: accent }}>
            {d.ctaSecondary}
          </a>
        </div>
      </section>

      {/* درباره */}
      {d.aboutText && (
        <section className="mx-auto max-w-3xl px-6 pb-14">
          <div className="rounded-[28px] bg-white/70 p-8 shadow-sm">
            <h2 className="mb-3 text-xl font-extrabold">{fa ? "درباره‌ی من" : "About me"}</h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#7c5a63]">{d.aboutText}</p>
            {d.contactInfo && (
              <p className="mt-4 flex items-center gap-2 text-xs font-bold" style={{ color: accent }}>
                <Mail size={14} /> {d.contactInfo}
              </p>
            )}
          </div>
        </section>
      )}

      {/* ویژگی‌ها */}
      {d.features.length > 0 && (
        <section className="mx-auto max-w-5xl px-6 pb-14">
          <div className="grid gap-4 md:grid-cols-3">
            {d.features.map((f, i) => (
              <div key={i} className="rounded-3xl bg-white/70 p-6 shadow-sm">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl text-white" style={{ background: accent }}>
                  <Star size={17} />
                </div>
                <h3 className="font-extrabold">{f.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-[#7c5a63]">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* نظرات */}
      {d.testimonials.length > 0 && (
        <section className="mx-auto max-w-5xl px-6 pb-14">
          <h2 className="mb-5 text-center text-2xl font-extrabold">{fa ? "نظر شاگردها" : "Testimonials"}</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {d.testimonials.map((t, i) => (
              <div key={i} className="rounded-3xl bg-white/70 p-6 shadow-sm">
                <p className="text-sm leading-relaxed text-[#40222c]">«{t.text}»</p>
                <p className="mt-4 text-xs font-extrabold" style={{ color: accent }}>{t.name}</p>
                <p className="text-[10px] text-[#7c5a63]">{t.role}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* تعرفه‌ها */}
      {d.pricing.length > 0 && (
        <section id="pricing" className="mx-auto max-w-5xl px-6 pb-20">
          <h2 className="mb-5 text-center text-2xl font-extrabold">{fa ? "تعرفه‌ها" : "Pricing"}</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {d.pricing.map((p, i) => (
              <div
                key={i}
                className={`rounded-3xl p-6 shadow-sm ${p.highlight ? "bg-white" : "bg-white/70"}`}
                style={p.highlight ? { border: `2px solid ${accent}` } : undefined}
              >
                {p.highlight && (
                  <span className="chip-lux mb-2 text-white" style={{ background: accent }}>
                    {fa ? "پیشنهادی" : "Featured"}
                  </span>
                )}
                <h3 className="font-extrabold">{p.title}</h3>
                {(() => {
                  const both = formatPriceBoth(p.price);
                  const main = fa ? both.fa : both.en;
                  const alt = fa ? both.en : both.fa;
                  return (
                    <>
                      <p className="mt-2 text-3xl font-extrabold tabular-nums" style={{ color: accent }}>
                        {main}
                      </p>
                      <p className="text-[11px] font-bold tabular-nums text-[#96707b]" dir="ltr">
                        {alt}
                      </p>
                    </>
                  );
                })()}
                <p className="text-[10px] text-[#7c5a63]">{p.period}</p>
                <ul className="mt-4 space-y-2">
                  {p.features.filter(Boolean).map((f, fi) => (
                    <li key={fi} className="flex items-center gap-2 text-xs">
                      <Check size={13} style={{ color: accent }} /> {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      <footer className="border-t border-[#4a2430]/10 py-6 text-center text-[11px] text-[#7c5a63]">
        {d.teacherName} • {fa ? "قدرت‌گرفته از دستیار کلاس" : "Powered by Class Assistant"}
      </footer>
    </main>
  );
}