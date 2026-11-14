"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { ExternalLink, Plus, Save, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { getLandingForWorkspace, upsertLanding, type LandingData } from "@/lib/server/landing-actions";

const inputCls =
  "w-full rounded-xl border border-white/40 bg-white/40 px-4 py-2.5 text-sm font-bold outline-none transition focus:border-[#D94F63]";

type WS = { id: string; ownerName: string; name: string; slug: string };

export default function AdminLandingEditor({
  workspaces,
  initial,
}: {
  workspaces: WS[];
  initial: LandingData;
}) {
  const locale = useLocale();
  const fa = locale === "fa";
  const toast = useToast();

  const [wsId, setWsId] = useState<string | null>(initial.workspaceId);
  const [data, setData] = useState<LandingData>(initial);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = <K extends keyof LandingData>(k: K, v: LandingData[K]) =>
    setData((d) => ({ ...d, [k]: v }));

  const switchWorkspace = async (id: string) => {
    setLoading(true);
    setWsId(id || null);
    const next = await getLandingForWorkspace(id || null);
    setData(next);
    setLoading(false);
  };

  const save = async () => {
    setSaving(true);
    const res = await upsertLanding({ ...data, workspaceId: wsId });
    setSaving(false);
    if (res.ok) toast(fa ? "✅ لندینگ ذخیره شد" : "✅ Saved");
    else toast(res.error === "SLUG_TAKEN" ? (fa ? "❌ این slug قبلاً گرفته شده" : "❌ Slug taken") : "❌ خطا");
  };

  /* ── helper های آرایه‌ها ── */
  const updFeature = (i: number, patch: Partial<LandingData["features"][number]>) =>
    set("features", data.features.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));
  const updTesti = (i: number, patch: Partial<LandingData["testimonials"][number]>) =>
    set("testimonials", data.testimonials.map((t, idx) => (idx === i ? { ...t, ...patch } : t)));
  const updPricing = (i: number, patch: Partial<LandingData["pricing"][number]>) =>
    set("pricing", data.pricing.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">{fa ? "ویرایشگر لندینگ" : "Landing editor"}</h1>
          <p className="mt-1 text-xs text-[var(--c-ink-soft)]">
            {fa ? "لندینگ اختصاصی هر معلم رو شخصی‌سازی کن." : "Personalize each teacher's landing."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {wsId && data.slug && (
            <a
              href={`/${locale}/t/${data.slug}`}
              target="_blank"
              className="flex items-center gap-1 rounded-full bg-white/50 px-4 py-2 text-xs font-extrabold text-[var(--c-primary)]"
            >
              <ExternalLink size={13} /> {fa ? "پیش‌نمایش" : "Preview"}
            </a>
          )}
          <button
            type="button"
            onClick={save}
            disabled={saving || loading}
            className="btn-primary flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-extrabold shadow-lg disabled:opacity-60"
          >
            <Save size={15} /> {saving ? "..." : fa ? "ذخیره" : "Save"}
          </button>
        </div>
      </div>

      {/* انتخاب معلم */}
      <div className="card-lux p-4">
        <label className="mb-1 block text-xs font-extrabold">{fa ? "معلم" : "Teacher"}</label>
        <select className={inputCls} value={wsId ?? ""} onChange={(e) => switchWorkspace(e.target.value)}>
          <option value="">{fa ? "— انتخاب کن —" : "— select —"}</option>
          {workspaces.map((w) => (
            <option key={w.id} value={w.id}>
              {w.ownerName} {w.slug ? `(/t/${w.slug})` : ""}
            </option>
          ))}
        </select>
        {!wsId && (
          <p className="mt-2 text-[11px] text-[var(--c-ink-soft)]">
            {fa ? "اول یک معلم انتخاب کن تا لندینگش رو ویرایش کنی." : "Select a teacher first."}
          </p>
        )}
      </div>

      {wsId && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Hero */}
          <div className="card-lux space-y-3 p-5">
            <h2 className="text-sm font-extrabold">{fa ? "بخش Hero" : "Hero"}</h2>
            <input className={inputCls} placeholder={fa ? "بج بالای عنوان" : "Badge"} value={data.heroBadge} onChange={(e) => set("heroBadge", e.target.value)} />
            <input className={inputCls} placeholder={fa ? "عنوان خط ۱" : "Title line 1"} value={data.heroTitle1} onChange={(e) => set("heroTitle1", e.target.value)} />
            <input className={inputCls} placeholder={fa ? "عنوان خط ۲" : "Title line 2"} value={data.heroTitle2} onChange={(e) => set("heroTitle2", e.target.value)} />
            <textarea className={inputCls + " min-h-[70px]"} placeholder={fa ? "زیرعنوان" : "Subtitle"} value={data.heroSub} onChange={(e) => set("heroSub", e.target.value)} />
            <div className="grid grid-cols-2 gap-2">
              <input className={inputCls} placeholder={fa ? "دکمه‌ی اصلی" : "Primary CTA"} value={data.ctaPrimary} onChange={(e) => set("ctaPrimary", e.target.value)} />
              <input className={inputCls} placeholder={fa ? "دکمه‌ی دوم" : "Secondary CTA"} value={data.ctaSecondary} onChange={(e) => set("ctaSecondary", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-[10px] font-extrabold">{fa ? "رنگ تأکیدی" : "Accent"}</label>
                <input type="color" className="h-10 w-full cursor-pointer rounded-xl border border-white/40 bg-white/40" value={data.accentColor} onChange={(e) => set("accentColor", e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-extrabold">Slug (URL)</label>
                <input className={inputCls} dir="ltr" placeholder="sara-english" value={data.slug} onChange={(e) => set("slug", e.target.value)} />
              </div>
            </div>
          </div>

          {/* درباره + تماس */}
          <div className="card-lux space-y-3 p-5">
            <h2 className="text-sm font-extrabold">{fa ? "درباره + تماس" : "About + Contact"}</h2>
            <textarea className={inputCls + " min-h-[110px]"} placeholder={fa ? "متن درباره‌ی معلم" : "About the teacher"} value={data.aboutText} onChange={(e) => set("aboutText", e.target.value)} />
            <input className={inputCls} placeholder={fa ? "اطلاعات تماس (ایمیل / تلفن)" : "Contact info"} value={data.contactInfo} onChange={(e) => set("contactInfo", e.target.value)} />
          </div>

          {/* ویژگی‌ها */}
          <div className="card-lux space-y-3 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold">{fa ? "ویژگی‌ها" : "Features"}</h2>
              <button type="button" onClick={() => set("features", [...data.features, { title: "", desc: "" }])} className="flex items-center gap-1 rounded-full bg-white/50 px-3 py-1.5 text-[11px] font-extrabold text-[var(--c-primary)]">
                <Plus size={12} /> {fa ? "افزودن" : "Add"}
              </button>
            </div>
            {data.features.map((f, i) => (
              <div key={i} className="space-y-2 rounded-2xl bg-[var(--c-surface-2)] p-3">
                <div className="flex gap-2">
                  <input className={inputCls} placeholder={fa ? "عنوان" : "Title"} value={f.title} onChange={(e) => updFeature(i, { title: e.target.value })} />
                  <button type="button" onClick={() => set("features", data.features.filter((_, idx) => idx !== i))} className="rounded-lg bg-[#f6d2ce] p-2 text-[#b3261e]">
                    <Trash2 size={13} />
                  </button>
                </div>
                <input className={inputCls} placeholder={fa ? "توضیح" : "Description"} value={f.desc} onChange={(e) => updFeature(i, { desc: e.target.value })} />
              </div>
            ))}
          </div>

          {/* نظرات */}
          <div className="card-lux space-y-3 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold">{fa ? "نظرات شاگردها" : "Testimonials"}</h2>
              <button type="button" onClick={() => set("testimonials", [...data.testimonials, { name: "", role: "", text: "" }])} className="flex items-center gap-1 rounded-full bg-white/50 px-3 py-1.5 text-[11px] font-extrabold text-[var(--c-primary)]">
                <Plus size={12} /> {fa ? "افزودن" : "Add"}
              </button>
            </div>
            {data.testimonials.map((t, i) => (
              <div key={i} className="space-y-2 rounded-2xl bg-[var(--c-surface-2)] p-3">
                <div className="flex gap-2">
                  <input className={inputCls} placeholder={fa ? "نام" : "Name"} value={t.name} onChange={(e) => updTesti(i, { name: e.target.value })} />
                  <input className={inputCls} placeholder={fa ? "نقش" : "Role"} value={t.role} onChange={(e) => updTesti(i, { role: e.target.value })} />
                  <button type="button" onClick={() => set("testimonials", data.testimonials.filter((_, idx) => idx !== i))} className="rounded-lg bg-[#f6d2ce] p-2 text-[#b3261e]">
                    <Trash2 size={13} />
                  </button>
                </div>
                <textarea className={inputCls + " min-h-[60px]"} placeholder={fa ? "متن نظر" : "Text"} value={t.text} onChange={(e) => updTesti(i, { text: e.target.value })} />
              </div>
            ))}
          </div>

          {/* تعرفه‌ها */}
          <div className="card-lux space-y-3 p-5 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold">{fa ? "تعرفه‌ها" : "Pricing"}</h2>
              <button type="button" onClick={() => set("pricing", [...data.pricing, { title: "", price: "", period: "", highlight: false, features: [] }])} className="flex items-center gap-1 rounded-full bg-white/50 px-3 py-1.5 text-[11px] font-extrabold text-[var(--c-primary)]">
                <Plus size={12} /> {fa ? "افزودن" : "Add"}
              </button>
            </div>
            {data.pricing.map((p, i) => (
              <div key={i} className="space-y-2 rounded-2xl bg-[var(--c-surface-2)] p-3">
                <div className="flex flex-wrap gap-2">
                  <input className={inputCls + " flex-1"} placeholder={fa ? "عنوان پلن" : "Plan"} value={p.title} onChange={(e) => updPricing(i, { title: e.target.value })} />
                  <input className={inputCls + " w-28"} placeholder={fa ? "قیمت" : "Price"} value={p.price} onChange={(e) => updPricing(i, { price: e.target.value })} />
                  <input className={inputCls + " w-32"} placeholder={fa ? "دوره" : "Period"} value={p.period} onChange={(e) => updPricing(i, { period: e.target.value })} />
                  <label className="flex items-center gap-1 rounded-xl bg-white/40 px-3 text-[11px] font-extrabold">
                    <input type="checkbox" checked={p.highlight} onChange={(e) => updPricing(i, { highlight: e.target.checked })} />
                    {fa ? "پیشنهادی" : "Featured"}
                  </label>
                  <button type="button" onClick={() => set("pricing", data.pricing.filter((_, idx) => idx !== i))} className="rounded-lg bg-[#f6d2ce] p-2 text-[#b3261e]">
                    <Trash2 size={13} />
                  </button>
                </div>
                <textarea
                  className={inputCls + " min-h-[60px]"}
                  placeholder={fa ? "هر ویژگی در یک خط" : "One feature per line"}
                  value={p.features.join("\n")}
                  onChange={(e) => updPricing(i, { features: e.target.value.split("\n") })}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}