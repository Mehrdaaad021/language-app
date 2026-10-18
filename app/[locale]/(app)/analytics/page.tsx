"use client";

import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import { Stagger, StaggerItem } from "@/components/ui/Reveal";
import { useAppData } from "@/lib/store";
import { formatNumber } from "@/lib/format";

const COLORS = { upcoming: "#D9822B", completed: "#4E9470", cancelled: "#C4576A" } as const;

export default function AnalyticsPage() {
  const t = useTranslations("Analytics");
  const tp = useTranslations("Pages");
  const locale = useLocale();
  const { sessions, payments, students } = useAppData();

  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return {
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en-US", { month: "short" }).format(d),
    };
  });

  const income = months.map((m) =>
    payments.filter((p) => p.status === "paid" && p.date.startsWith(m.key)).reduce((a, p) => a + p.amount, 0)
  );
  const maxIncome = Math.max(...income, 1);
  const thisMonth = income[5] ?? 0;
  const lastMonth = income[4] ?? 0;
  const delta = lastMonth === 0 ? (thisMonth > 0 ? 100 : 0) : Math.round(((thisMonth - lastMonth) / lastMonth) * 100);

  const statusCounts = (["upcoming", "completed", "cancelled"] as const).map((s) => ({
    status: s,
    count: sessions.filter((x) => x.status === s).length,
  }));
  const totalSessions = Math.max(sessions.length, 1);

  const levels = Array.from(new Set(students.map((s) => s.level))).map((l) => ({
    level: l,
    count: students.filter((s) => s.level === l).length,
  }));
  const maxLevel = Math.max(...levels.map((l) => l.count), 1);

  const R = 42;
  const C = 2 * Math.PI * R;
  let acc = 0;

  return (
    <Stagger>
      <StaggerItem>
        <PageHeader title={t("title")} subtitle={t("subtitle")} />
      </StaggerItem>

      <Stagger className="grid gap-6 lg:grid-cols-2">
        <StaggerItem>
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-extrabold">{t("incomeTrend")}</h2>
              <span className={`flex items-center gap-1 text-xs font-extrabold ${delta >= 0 ? "text-[#2F6B4F]" : "text-[#B23A4C]"}`}>
                {delta >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {formatNumber(delta, locale)}%
              </span>
            </div>
            <div className="flex h-44 items-end gap-3">
              {months.map((m, i) => (
                <div key={m.key} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max((income[i] / maxIncome) * 100, 4)}%` }}
                    transition={{ type: "spring", stiffness: 120, damping: 20, delay: 0.08 * i }}
                    className="w-full rounded-t-xl bg-gradient-to-t from-[#D94F63] to-[#E8697B]"
                    title={formatNumber(income[i], locale)}
                  />
                  <span className="text-[10px] font-bold text-[var(--color-ink-soft)]">{m.label}</span>
                </div>
              ))}
            </div>
          </Card>
        </StaggerItem>

        <StaggerItem>
          <Card>
            <h2 className="mb-4 text-lg font-extrabold">{t("sessionSplit")}</h2>
            <div className="flex items-center gap-6">
              <svg viewBox="0 0 100 100" className="h-36 w-36 -rotate-90">
                <circle cx="50" cy="50" r={R} fill="none" stroke="rgba(128,128,128,0.25)" strokeWidth="12" />
                {statusCounts.map((s) => {
                  const frac = s.count / totalSessions;
                  const dash = frac * C;
                  const offset = -acc * C;
                  acc += frac;
                  return (
                    <motion.circle
                      key={s.status}
                      cx="50" cy="50" r={R} fill="none"
                      stroke={COLORS[s.status]}
                      strokeWidth="12"
                      strokeDasharray={`${dash} ${C - dash}`}
                      strokeDashoffset={offset}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.25 }}
                    />
                  );
                })}
              </svg>
              <ul className="flex flex-1 flex-col gap-3">
                {statusCounts.map((s) => (
                  <li key={s.status} className="flex items-center justify-between text-xs font-bold">
                    <span className="flex items-center gap-2 text-[var(--color-ink-soft)]">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[s.status] }} />
                      {s.status === "upcoming" ? tp("upcoming") : s.status === "completed" ? tp("completed") : tp("cancelled")}
                    </span>
                    <span>{formatNumber(s.count, locale)} {t("sessions")}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </StaggerItem>
      </Stagger>

      <StaggerItem className="mt-6">
        <Card>
          <h2 className="mb-4 text-lg font-extrabold">{t("levelSplit")}</h2>
          <ul className="flex flex-col gap-4">
            {levels.map((l, i) => (
              <li key={l.level} className="flex items-center gap-4">
                <span className="w-10 text-xs font-extrabold">{l.level}</span>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-white/30">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(l.count / maxLevel) * 100}%` }}
                    transition={{ type: "spring", stiffness: 120, damping: 20, delay: 0.08 * i }}
                    className="h-full rounded-full bg-gradient-to-l from-[#E8697B] to-[#D94F63]"
                  />
                </div>
                <span className="w-20 text-end text-xs font-bold text-[var(--color-ink-soft)]">
                  {formatNumber(l.count, locale)} {t("students")}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </StaggerItem>
    </Stagger>
  );
}