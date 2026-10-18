"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Save, RotateCcw } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { Stagger, StaggerItem } from "@/components/ui/Reveal";
import { getSiteConfig, updateSiteConfig, type LandingContent, type SiteConfigData } from "@/lib/server/config-actions";

const TABS = ["brand", "hero", "stats", "features", "showcase", "pricing", "testimonials", "faq", "cta", "footer"] as const;
type Tab = (typeof TABS)[number];
type LocaleKey = "fa" | "en";

export default function LandingEditorPage() {
  const t = useTranslations("LandingEditor");
  const toast = useToast();
  const [data, setData] = useState<SiteConfigData | null>(null);
  const [original, setOriginal] = useState<SiteConfigData | null>(null);
  const [locale, setLocale] = useState<LocaleKey>("fa");
  const [tab, setTab] = useState<Tab>("brand");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSiteConfig().then((c) => {
      setData(c);
      setOriginal(c);
    });
  }, []);

  if (!data || !original) return <p className="p-10 text-center text-sm font-bold text-[var(--color-ink-soft)]">...</p>;

  const config = data[locale];

  const update = (next: LandingContent) => {
    setData({ ...data, [locale]: next });
  };

  const save = async () => {
    setSaving(true);
    try {
      await updateSiteConfig(data);
      setOriginal(data);
      toast(t("saved"));
    } catch {
      toast(t("saveError"));
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setData(original);
    toast(t("reset"));
  };

  return (
    <Stagger>
      <StaggerItem>
        <PageHeader
          title={t("title")}
          subtitle={t("subtitle")}
          action={
            <div className="flex gap-2">
              <Button variant="ghost" icon={<RotateCcw size={16} />} onClick={reset}>
                {t("resetBtn")}
              </Button>
              <Button icon={<Save size={16} />} onClick={save}>
                {saving ? t("saving") : t("save")}
              </Button>
            </div>
          }
        />
      </StaggerItem>

      <StaggerItem>
        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold text-[var(--color-ink-soft)]">{t("editLocale")}</span>
          {(["fa", "en"] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLocale(l)}
              className={`rounded-full px-4 py-2 text-xs font-extrabold transition ${
                locale === l
                  ? "bg-gradient-to-b from-[#E8697B] to-[#D94F63] text-white shadow-lg"
                  : "glass text-[var(--color-ink-soft)] hover:bg-white/40"
              }`}
            >
              {l === "fa" ? "فارسی" : "English"}
            </button>
          ))}
        </div>
      </StaggerItem>

      <StaggerItem className="mt-4">
        <div className="flex flex-wrap gap-2">
          {TABS.map((tabKey) => (
            <button
              key={tabKey}
              onClick={() => setTab(tabKey)}
              className={`rounded-full px-4 py-2 text-xs font-extrabold transition ${
                tab === tabKey
                  ? "bg-gradient-to-b from-[#E8697B] to-[#D94F63] text-white shadow-lg"
                  : "glass text-[var(--color-ink-soft)] hover:bg-white/40"
              }`}
            >
              {t(`tabs.${tabKey}`)}
            </button>
          ))}
        </div>
      </StaggerItem>

      <StaggerItem className="mt-6">
        <Card>
          {tab === "brand" && (
            <div className="flex flex-col gap-4">
              <TextField label={t("brand.name")} value={config.brand.name} onChange={(e) => update({ ...config, brand: { ...config.brand, name: e.target.value } })} />
              <TextField label={t("brand.tagline")} value={config.brand.tagline} onChange={(e) => update({ ...config, brand: { ...config.brand, tagline: e.target.value } })} />
            </div>
          )}

          {tab === "hero" && (
            <div className="flex flex-col gap-4">
              <TextField label={t("hero.badge")} value={config.hero.badge} onChange={(e) => update({ ...config, hero: { ...config.hero, badge: e.target.value } })} />
              <TextField label={t("hero.title1")} value={config.hero.title1} onChange={(e) => update({ ...config, hero: { ...config.hero, title1: e.target.value } })} />
              <TextField label={t("hero.title2")} value={config.hero.title2} onChange={(e) => update({ ...config, hero: { ...config.hero, title2: e.target.value } })} />
              <TextField label={t("hero.subtitle")} value={config.hero.subtitle} onChange={(e) => update({ ...config, hero: { ...config.hero, subtitle: e.target.value } })} />
              <TextField label={t("hero.trustText")} value={config.hero.trustText} onChange={(e) => update({ ...config, hero: { ...config.hero, trustText: e.target.value } })} />
            </div>
          )}

          {tab === "stats" && (
            <div className="grid gap-4 md:grid-cols-2">
              {(["teachers", "sessions", "notes", "uptime"] as const).map((key) => (
                <div key={key} className="flex flex-col gap-2 rounded-2xl bg-white/25 p-4">
                  <TextField label={t(`stats.${key}.value`)} value={config.stats[key].value} onChange={(e) => update({ ...config, stats: { ...config.stats, [key]: { ...config.stats[key], value: e.target.value } } })} />
                  <TextField label={t(`stats.${key}.label`)} value={config.stats[key].label} onChange={(e) => update({ ...config, stats: { ...config.stats, [key]: { ...config.stats[key], label: e.target.value } } })} />
                </div>
              ))}
            </div>
          )}

          {tab === "features" && (
            <div className="flex flex-col gap-4">
              <TextField label={t("features.title")} value={config.features.title} onChange={(e) => update({ ...config, features: { ...config.features, title: e.target.value } })} />
              <TextField label={t("features.subtitle")} value={config.features.subtitle} onChange={(e) => update({ ...config, features: { ...config.features, subtitle: e.target.value } })} />
              {config.features.items.map((item, i) => (
                <div key={i} className="flex flex-col gap-3 rounded-2xl bg-white/25 p-4">
                  <p className="text-xs font-extrabold text-[var(--color-ink-soft)]">{t("features.item", { n: i + 1 })}</p>
                  <TextField label={t("features.icon")} value={item.icon} onChange={(e) => {
                    const items = [...config.features.items];
                    items[i] = { ...items[i], icon: e.target.value };
                    update({ ...config, features: { ...config.features, items } });
                  }} />
                  <TextField label={t("features.itemTitle")} value={item.title} onChange={(e) => {
                    const items = [...config.features.items];
                    items[i] = { ...items[i], title: e.target.value };
                    update({ ...config, features: { ...config.features, items } });
                  }} />
                  <TextField label={t("features.itemDesc")} value={item.desc} onChange={(e) => {
                    const items = [...config.features.items];
                    items[i] = { ...items[i], desc: e.target.value };
                    update({ ...config, features: { ...config.features, items } });
                  }} />
                </div>
              ))}
            </div>
          )}

          {tab === "showcase" && (
            <div className="flex flex-col gap-4">
              <TextField label={t("showcase.title")} value={config.showcase.title} onChange={(e) => update({ ...config, showcase: { ...config.showcase, title: e.target.value } })} />
              <TextField label={t("showcase.subtitle")} value={config.showcase.subtitle} onChange={(e) => update({ ...config, showcase: { ...config.showcase, subtitle: e.target.value } })} />
            </div>
          )}

          {tab === "pricing" && (
            <div className="flex flex-col gap-4">
              <TextField label={t("pricing.title")} value={config.pricing.title} onChange={(e) => update({ ...config, pricing: { ...config.pricing, title: e.target.value } })} />
              <TextField label={t("pricing.subtitle")} value={config.pricing.subtitle} onChange={(e) => update({ ...config, pricing: { ...config.pricing, subtitle: e.target.value } })} />
              {config.pricing.plans.map((plan, i) => (
                <div key={i} className="flex flex-col gap-3 rounded-2xl bg-white/25 p-4">
                  <p className="text-xs font-extrabold text-[var(--color-ink-soft)]">{t("pricing.plan", { n: i + 1 })}</p>
                  <TextField label={t("pricing.planName")} value={plan.name} onChange={(e) => {
                    const plans = [...config.pricing.plans];
                    plans[i] = { ...plans[i], name: e.target.value };
                    update({ ...config, pricing: { ...config.pricing, plans } });
                  }} />
                  <TextField label={t("pricing.planPrice")} value={plan.price} onChange={(e) => {
                    const plans = [...config.pricing.plans];
                    plans[i] = { ...plans[i], price: e.target.value };
                    update({ ...config, pricing: { ...config.pricing, plans } });
                  }} />
                  <TextField label={t("pricing.planDesc")} value={plan.desc} onChange={(e) => {
                    const plans = [...config.pricing.plans];
                    plans[i] = { ...plans[i], desc: e.target.value };
                    update({ ...config, pricing: { ...config.pricing, plans } });
                  }} />
                  <label className="flex items-center gap-2 text-xs font-bold">
                    <input
                      type="checkbox"
                      checked={plan.hot}
                      onChange={(e) => {
                        const plans = [...config.pricing.plans];
                        plans[i] = { ...plans[i], hot: e.target.checked };
                        update({ ...config, pricing: { ...config.pricing, plans } });
                      }}
                    />
                    {t("pricing.popular")}
                  </label>
                </div>
              ))}
            </div>
          )}

          {tab === "testimonials" && (
            <div className="flex flex-col gap-4">
              <TextField label={t("testimonials.title")} value={config.testimonials.title} onChange={(e) => update({ ...config, testimonials: { ...config.testimonials, title: e.target.value } })} />
              {config.testimonials.items.map((item, i) => (
                <div key={i} className="flex flex-col gap-3 rounded-2xl bg-white/25 p-4">
                  <p className="text-xs font-extrabold text-[var(--color-ink-soft)]">{t("testimonials.item", { n: i + 1 })}</p>
                  <TextField label={t("testimonials.name")} value={item.name} onChange={(e) => {
                    const items = [...config.testimonials.items];
                    items[i] = { ...items[i], name: e.target.value };
                    update({ ...config, testimonials: { ...config.testimonials, items } });
                  }} />
                  <TextField label={t("testimonials.role")} value={item.role} onChange={(e) => {
                    const items = [...config.testimonials.items];
                    items[i] = { ...items[i], role: e.target.value };
                    update({ ...config, testimonials: { ...config.testimonials, items } });
                  }} />
                  <TextField label={t("testimonials.text")} value={item.text} onChange={(e) => {
                    const items = [...config.testimonials.items];
                    items[i] = { ...items[i], text: e.target.value };
                    update({ ...config, testimonials: { ...config.testimonials, items } });
                  }} />
                </div>
              ))}
            </div>
          )}

          {tab === "faq" && (
            <div className="flex flex-col gap-4">
              <TextField label={t("faq.title")} value={config.faq.title} onChange={(e) => update({ ...config, faq: { ...config.faq, title: e.target.value } })} />
              {config.faq.items.map((item, i) => (
                <div key={i} className="flex flex-col gap-3 rounded-2xl bg-white/25 p-4">
                  <p className="text-xs font-extrabold text-[var(--color-ink-soft)]">{t("faq.item", { n: i + 1 })}</p>
                  <TextField label={t("faq.q")} value={item.q} onChange={(e) => {
                    const items = [...config.faq.items];
                    items[i] = { ...items[i], q: e.target.value };
                    update({ ...config, faq: { ...config.faq, items } });
                  }} />
                  <TextField label={t("faq.a")} value={item.a} onChange={(e) => {
                    const items = [...config.faq.items];
                    items[i] = { ...items[i], a: e.target.value };
                    update({ ...config, faq: { ...config.faq, items } });
                  }} />
                </div>
              ))}
            </div>
          )}

          {tab === "cta" && (
            <div className="flex flex-col gap-4">
              <TextField label={t("cta.title")} value={config.cta.title} onChange={(e) => update({ ...config, cta: { ...config.cta, title: e.target.value } })} />
              <TextField label={t("cta.subtitle")} value={config.cta.subtitle} onChange={(e) => update({ ...config, cta: { ...config.cta, subtitle: e.target.value } })} />
            </div>
          )}

          {tab === "footer" && (
            <div className="flex flex-col gap-4">
              <TextField label={t("footer.rights")} value={config.footer.rights} onChange={(e) => update({ ...config, footer: { ...config.footer, rights: e.target.value } })} />
              <TextField label={t("footer.made")} value={config.footer.made} onChange={(e) => update({ ...config, footer: { ...config.footer, made: e.target.value } })} />
            </div>
          )}
        </Card>
      </StaggerItem>
    </Stagger>
  );
}