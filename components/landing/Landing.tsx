"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import {
  BookOpen, NotebookPen, FileDown, BarChart3, Languages, Moon, ShieldCheck,
  Star, Check, ChevronDown, Sparkles,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import Notebook from "@/components/ui/Notebook";
import LocaleSwitcher from "@/components/LocaleSwitcher";
import ThemeToggle from "@/components/ui/ThemeToggle";
import type { Note } from "@/lib/types";
import type { LandingContent } from "@/lib/server/config-actions";

const ICON_MAP = { NotebookPen, FileDown, BarChart3, Languages, Moon, ShieldCheck } as const;

const DEMO_NOTES: Note[] = [
  {
    id: "d1",
    studentId: "demo",
    title: "Session 4 — Grammar recap",
    content: "Second conditional:\nIf + past simple → would + verb\n\nIf I had time, I would travel.\n\nHomework: write 10 sentences.",
    date: "2026-04-07",
    attachments: [],
  },
  {
    id: "d2",
    studentId: "demo",
    title: "New vocabulary — Travel",
    content: "itinerary\nlayover\nbaggage claim\ncustoms\n\nUse each word in one sentence.",
    date: "2026-04-04",
    attachments: [],
  },
];

const fade = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { type: "spring" as const, stiffness: 120, damping: 20 },
};

export default function Landing({
  role,
  firstRun,
  content,
}: {
  role: "ADMIN" | "TEACHER" | "STUDENT" | null;
  firstRun: boolean;
  content: LandingContent;
}) {
  const t = useTranslations("Landing");
  const [faq, setFaq] = useState<number | null>(0);

  const startHref = role
    ? role === "ADMIN"
      ? "/admin"
      : role === "TEACHER"
      ? "/dashboard"
      : "/student"
    : firstRun
    ? "/setup"
    : "/login";
  const ctaLabel = role ? t("ctaOpen") : t("ctaStart");

  return (
    <div className="relative min-h-screen overflow-x-clip">
      <div className="glass-bg">
        <div className="blob-3" />
      </div>

      <header className="sticky top-0 z-40 px-4 pt-4">
        <div className="glass-strong mx-auto flex max-w-6xl items-center justify-between rounded-2xl px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#E8697B] to-[#D94F63] text-white shadow-lg">
              <BookOpen size={18} />
            </span>
            <p className="text-sm font-extrabold">{content.brand.name}</p>
          </div>
          <nav className="hidden items-center gap-6 text-xs font-bold text-[var(--color-ink-soft)] md:flex">
            <a href="#features" className="transition hover:text-[var(--color-ink)]">{t("navFeatures")}</a>
            <a href="#showcase" className="transition hover:text-[var(--color-ink)]">{t("navShowcase")}</a>
            <a href="#pricing" className="transition hover:text-[var(--color-ink)]">{t("navPricing")}</a>
            <a href="#faq" className="transition hover:text-[var(--color-ink)]">{t("navFaq")}</a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle compact />
            <LocaleSwitcher compact />
            <Link
              href={startHref}
              className="rounded-full bg-gradient-to-b from-[#E8697B] to-[#D94F63] px-4 py-2 text-xs font-extrabold text-white shadow-[0_10px_26px_-12px_rgba(217,79,99,0.8)] transition hover:brightness-105"
            >
              {ctaLabel}
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 pb-24 pt-16 md:pt-24">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <motion.div {...fade}>
            <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-extrabold text-[var(--color-ink-soft)]">
              <Sparkles size={13} className="text-[var(--color-primary)]" />
              {content.hero.badge}
            </span>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.2] md:text-6xl md:leading-[1.15]">
              {content.hero.title1}
              <span className="bg-gradient-to-l from-[#D94F63] to-[#E8697B] bg-clip-text text-transparent"> {content.hero.title2}</span>
            </h1>
            <p className="mt-6 max-w-xl text-sm leading-8 text-[var(--color-ink-soft)] md:text-base md:leading-9">
              {content.hero.subtitle}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href={startHref}
                className="rounded-full bg-gradient-to-b from-[#E8697B] to-[#D94F63] px-7 py-3 text-sm font-extrabold text-white shadow-[0_16px_40px_-14px_rgba(217,79,99,0.9)] transition hover:-translate-y-0.5 hover:brightness-105"
              >
                {ctaLabel}
              </Link>
              <a href="#showcase" className="glass rounded-full px-7 py-3 text-sm font-extrabold text-[var(--color-ink)] transition hover:bg-white/40">
                {t("ctaDemo")}
              </a>
            </div>
            <div className="mt-8 flex items-center gap-3 text-[11px] font-bold text-[var(--color-ink-soft)]">
              <div className="flex">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star key={i} size={13} className="fill-[#E8A5A5] text-[#E8A5A5]" />
                ))}
              </div>
              {content.hero.trustText}
            </div>
          </motion.div>

          <motion.div {...fade} className="relative hidden lg:block">
            <div className="glass-strong rounded-[28px] p-6 shadow-[0_50px_100px_-45px_rgba(58,42,46,0.55)]">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#E8697B] to-[#D94F63] text-white">
                  <BookOpen size={18} />
                </div>
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#E8A5A5]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#E7BC8A]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#A6D8BA]" />
                </div>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="rounded-2xl bg-white/30 p-3">
                    <div className="h-2 w-8 rounded-full bg-white/70" />
                    <div className="mt-2 h-4 w-12 rounded-full bg-[var(--color-ink)]/20" />
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-col gap-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl bg-white/30 px-3 py-3">
                    <div className="h-2.5 w-24 rounded-full bg-white/70" />
                    <div className="h-2.5 w-10 rounded-full bg-[#E8A5A5]" />
                  </div>
                ))}
              </div>
            </div>
            <motion.span
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
              className="glass-strong absolute -top-6 end-2 rounded-2xl px-4 py-3 text-xs font-extrabold shadow-xl"
            >
              {t("f2t")} 📄
            </motion.span>
            <motion.span
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              className="glass-strong absolute -start-6 bottom-10 rounded-2xl px-4 py-3 text-xs font-extrabold shadow-xl"
            >
              FA / EN 🌐
            </motion.span>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4">
        <motion.div {...fade} className="glass grid grid-cols-2 gap-6 rounded-[28px] p-8 md:grid-cols-4">
          {[content.stats.teachers, content.stats.sessions, content.stats.notes, content.stats.uptime].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-extrabold tracking-tight">{s.value}</p>
              <p className="mt-1 text-xs font-bold text-[var(--color-ink-soft)]">{s.label}</p>
            </div>
          ))}
        </motion.div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-4 py-24">
        <motion.div {...fade} className="mb-12 text-center">
          <h2 className="text-3xl font-extrabold md:text-4xl">{content.features.title}</h2>
          <p className="mt-3 text-sm text-[var(--color-ink-soft)]">{content.features.subtitle}</p>
        </motion.div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {content.features.items.map((f, i) => {
            const Icon = ICON_MAP[f.icon as keyof typeof ICON_MAP] ?? ShieldCheck;
            return (
              <motion.div key={f.title} {...fade} transition={{ ...fade.transition, delay: 0.06 * i }}>
                <div className="glass glass-hover h-full rounded-[24px] p-6">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E8697B] to-[#D94F63] text-white shadow-[0_10px_26px_-12px_rgba(217,79,99,0.8)]">
                    <Icon size={20} />
                  </span>
                  <h3 className="mt-4 font-extrabold">{f.title}</h3>
                  <p className="mt-2 text-xs leading-6 text-[var(--color-ink-soft)]">{f.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      <section id="showcase" className="mx-auto max-w-5xl px-4 pb-24">
        <motion.div {...fade} className="mb-10 text-center">
          <h2 className="text-3xl font-extrabold md:text-4xl">{content.showcase.title}</h2>
          <p className="mt-3 text-sm text-[var(--color-ink-soft)]">{content.showcase.subtitle}</p>
        </motion.div>
        <motion.div {...fade} className="glass-strong rounded-[32px] p-6 md:p-10">
          <Notebook notes={DEMO_NOTES} />
        </motion.div>
      </section>

      <section id="pricing" className="mx-auto max-w-6xl px-4 pb-24">
        <motion.div {...fade} className="mb-12 text-center">
          <h2 className="text-3xl font-extrabold md:text-4xl">{content.pricing.title}</h2>
          <p className="mt-3 text-sm text-[var(--color-ink-soft)]">{content.pricing.subtitle}</p>
        </motion.div>
        <div className="grid gap-6 lg:grid-cols-3">
          {content.pricing.plans.map((p, i) => (
            <motion.div key={p.name} {...fade} transition={{ ...fade.transition, delay: 0.08 * i }}>
              <div className={p.hot ? "rounded-[26px] bg-gradient-to-b from-[#E8697B] to-[#D94F63] p-[1.5px] shadow-[0_30px_70px_-30px_rgba(217,79,99,0.8)]" : ""}>
                <div className={`glass-strong flex h-full flex-col rounded-[25px] p-7 ${p.hot ? "" : "glass"}`}>
                  {p.hot && (
                    <span className="mb-3 self-start rounded-full bg-gradient-to-b from-[#E8697B] to-[#D94F63] px-3 py-1 text-[10px] font-extrabold text-white">
                      {t("popular")}
                    </span>
                  )}
                  <p className="font-extrabold">{p.name}</p>
                  <p className="mt-1 text-xs text-[var(--color-ink-soft)]">{p.desc}</p>
                  <p className="mt-4 text-3xl font-extrabold tracking-tight">{p.price}</p>
                  <ul className="mt-5 flex flex-1 flex-col gap-2.5">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-xs font-bold text-[var(--color-ink-soft)]">
                        <Check size={14} className="shrink-0 text-[#2F6B4F]" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={startHref}
                    className={`mt-6 rounded-full py-2.5 text-center text-xs font-extrabold transition ${
                      p.hot
                        ? "bg-gradient-to-b from-[#E8697B] to-[#D94F63] text-white shadow-lg hover:brightness-105"
                        : "glass text-[var(--color-ink)] hover:bg-white/40"
                    }`}
                  >
                    {t("choosePlan")}
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-24">
        <motion.h2 {...fade} className="mb-12 text-center text-3xl font-extrabold md:text-4xl">
          {content.testimonials.title}
        </motion.h2>
        <div className="grid gap-5 md:grid-cols-3">
          {content.testimonials.items.map((tm, i) => (
            <motion.div key={tm.name} {...fade} transition={{ ...fade.transition, delay: 0.08 * i }}>
              <div className="glass h-full rounded-[24px] p-6">
                <div className="flex gap-1">
                  {[0, 1, 2, 3, 4].map((s) => (
                    <Star key={s} size={12} className="fill-[#E8A5A5] text-[#E8A5A5]" />
                  ))}
                </div>
                <p className="mt-4 text-xs leading-7 text-[var(--color-ink-soft)]">"{tm.text}"</p>
                <div className="mt-5 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#FFCED8] to-[#FFDDDD] text-sm font-extrabold text-[#8A4A56]">
                    {tm.name.charAt(0)}
                  </span>
                  <div>
                    <p className="text-xs font-extrabold">{tm.name}</p>
                    <p className="text-[10px] text-[var(--color-ink-soft)]">{tm.role}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-3xl px-4 pb-24">
        <motion.h2 {...fade} className="mb-10 text-center text-3xl font-extrabold md:text-4xl">
          {content.faq.title}
        </motion.h2>
        <div className="flex flex-col gap-3">
          {content.faq.items.map((f, i) => (
            <motion.div key={f.q} {...fade} transition={{ ...fade.transition, delay: 0.05 * i }}>
              <button
                onClick={() => setFaq(faq === i ? null : i)}
                className="glass flex w-full items-center justify-between rounded-2xl px-5 py-4 text-start text-sm font-extrabold transition hover:bg-white/35"
              >
                {f.q}
                <ChevronDown size={16} className={`shrink-0 transition-transform ${faq === i ? "rotate-180" : ""}`} />
              </button>
              {faq === i && (
                <motion.p
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="px-5 py-4 text-xs leading-7 text-[var(--color-ink-soft)]"
                >
                  {f.a}
                </motion.p>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-24">
        <motion.div {...fade} className="glass-strong relative overflow-hidden rounded-[32px] p-10 text-center md:p-16">
          <div className="pointer-events-none absolute -top-24 start-1/4 h-64 w-64 rounded-full bg-[#FFCED8] opacity-40 blur-3xl" />
          <h2 className="text-3xl font-extrabold md:text-4xl">{content.cta.title}</h2>
          <p className="mt-3 text-sm text-[var(--color-ink-soft)]">{content.cta.subtitle}</p>
          <Link
            href={startHref}
            className="mt-8 inline-block rounded-full bg-gradient-to-b from-[#E8697B] to-[#D94F63] px-9 py-3.5 text-sm font-extrabold text-white shadow-[0_16px_40px_-14px_rgba(217,79,99,0.9)] transition hover:-translate-y-0.5 hover:brightness-105"
          >
            {ctaLabel}
          </Link>
        </motion.div>
      </section>

      <footer className="border-t border-white/40 px-4 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#E8697B] to-[#D94F63] text-white">
              <BookOpen size={15} />
            </span>
            <p className="text-xs font-extrabold">{content.brand.name}</p>
          </div>
          <p className="text-[11px] font-bold text-[var(--color-ink-soft)]">
            © {new Date().getFullYear()} {content.brand.name} — {content.footer.rights}
          </p>
          <p className="text-[11px] font-bold text-[var(--color-ink-soft)]">{content.footer.made}</p>
        </div>
      </footer>
    </div>
  );
}