"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { CalendarDays, CheckCircle2, Circle, GraduationCap, Sparkles, Wallet, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useAppData } from "@/lib/store";
import { useToast } from "@/components/ui/Toast";
import { createDemoData } from "@/lib/server/demo-actions";

const HIDE_KEY = "onboarding-hidden-v1";

export default function OnboardingChecklist() {
  const locale = useLocale();
  const fa = locale === "fa";
  const { data, refresh } = useAppData();
  const toast = useToast();

  const [hidden, setHidden] = useState(false);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(HIDE_KEY) === "1") setHidden(true);
  }, []);

  if (hidden || !data) return null;

  const steps = [
    {
      done: (data.students?.length ?? 0) > 0,
      href: "/students",
      icon: GraduationCap,
      fa: "اولین شاگردت رو اضافه کن",
      en: "Add your first student",
    },
    {
      done: (data.sessions?.length ?? 0) > 0,
      href: "/sessions",
      icon: CalendarDays,
      fa: "اولین جلسه رو زمان‌بندی کن",
      en: "Schedule your first session",
    },
    {
      done: (data.payments?.length ?? 0) > 0,
      href: "/payments",
      icon: Wallet,
      fa: "اولین پرداخت رو ثبت کن",
      en: "Record your first payment",
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;

  // همه مراحل انجام شد → برای همیشه پنهان کن
  useEffect(() => {
    if (doneCount === steps.length) localStorage.setItem(HIDE_KEY, "1");
  }, [doneCount, steps.length]);

  if (doneCount === steps.length) return null;

  const dismiss = () => {
    localStorage.setItem(HIDE_KEY, "1");
    setHidden(true);
  };

  const seed = async () => {
    setSeeding(true);
    try {
      const res = await createDemoData();
      if (res.ok) {
        toast(fa ? "داده‌ی نمونه اضافه شد ✨" : "Sample data added ✨");
        await refresh();
      } else {
        toast(fa ? "از قبل داده داری!" : "You already have data");
      }
    } catch {
      toast(fa ? "خطا در افزودن داده‌ی نمونه" : "Failed to add sample data");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="glass-strong relative rounded-[24px] p-5 shadow-lg">
      <button
        type="button"
        onClick={dismiss}
        aria-label={fa ? "پنهان کردن" : "Dismiss"}
        className="absolute left-4 top-4 rounded-lg p-1 transition hover:bg-white/30"
      >
        <X size={16} />
      </button>

      <div className="mb-3 flex items-center gap-2">
        <Sparkles size={18} className="text-[var(--c-primary)]" />
        <h2 className="text-sm font-extrabold">
          {fa ? "شروع کن — فقط ۳ قدم" : "Get started — just 3 steps"}
        </h2>
        <span className="ms-auto text-xs font-bold text-[var(--c-ink-soft)]">
          {fa ? `${doneCount} از ${steps.length}` : `${doneCount}/${steps.length}`}
        </span>
      </div>

      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-white/30">
        <div
          className="h-full rounded-full bg-[var(--c-primary)] transition-all duration-500"
          style={{ width: `${(doneCount / steps.length) * 100}%` }}
        />
      </div>

      <ul className="space-y-2">
        {steps.map((s, i) => {
          const Icon = s.icon;
          return (
            <li key={i}>
              <Link
                href={s.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${
                  s.done ? "opacity-60" : "hover:bg-white/30"
                }`}
              >
                {s.done ? (
                  <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
                ) : (
                  <Circle size={18} className="shrink-0 text-[var(--c-ink-soft)]" />
                )}
                <Icon size={16} className="shrink-0 text-[var(--c-primary)]" />
                <span className={`text-sm font-bold ${s.done ? "line-through" : ""}`}>
                  {fa ? s.fa : s.en}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      {(data.students?.length ?? 0) === 0 && (
        <button
          type="button"
          onClick={seed}
          disabled={seeding}
          className="mt-4 w-full rounded-full bg-white/40 py-2.5 text-xs font-extrabold transition hover:bg-white/50 disabled:opacity-60"
        >
          {seeding
            ? fa ? "در حال افزودن..." : "Adding..."
            : fa ? "✨ یا با داده‌ی نمونه امتحان کن" : "✨ Or try with sample data"}
        </button>
      )}
    </div>
  );
}