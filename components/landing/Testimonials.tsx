import { Star } from "lucide-react";

export default function Testimonials({
  locale,
  t,
}: {
  locale: string;
  t: (key: string) => string;
}) {
  const testimonials = [
    { name: "t1name", role: "t1role", text: "t1text", rating: 5 },
    { name: "t2name", role: "t2role", text: "t2text", rating: 5 },
    { name: "t3name", role: "t3role", text: "t3text", rating: 5 },
  ];

  return (
    <section id="testimonials" className="bg-white/20 py-20 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-extrabold text-[#4a2430]">{t("testimonialsTitle")}</h2>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {testimonials.map((testimonial, i) => (
            <div
              key={i}
              className="glass-strong rounded-3xl p-6 shadow-xl"
            >
              <div className="mb-4 flex gap-1">
                {[...Array(testimonial.rating)].map((_, j) => (
                  <Star key={j} size={20} className="fill-[#f6e7c6] text-[#f6e7c6]" />
                ))}
              </div>
              <p className="mb-6 text-sm leading-relaxed text-[#40222c]">
                "{t(testimonial.text)}"
              </p>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#d94f63] to-[#c2586b] text-lg font-extrabold text-white">
                  {t(testimonial.name).charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-extrabold text-[#4a2430]">
                    {t(testimonial.name)}
                  </div>
                  <div className="text-xs text-[#96707b]">{t(testimonial.role)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}