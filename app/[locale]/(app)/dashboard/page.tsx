"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Users, CalendarDays, Wallet, AlertCircle, Plus } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import PageHeader from "@/components/ui/PageHeader";
import { Stagger, StaggerItem } from "@/components/ui/Reveal";
import NewSessionModal from "@/components/modals/NewSessionModal";
import { useAppData } from "@/lib/store";
import { formatNumber, formatDate, formatWeekday, formatTime } from "@/lib/format";

export default function DashboardPage() {
  const t = useTranslations("Dashboard");
  const locale = useLocale();
  const { students, sessions, payments } = useAppData();
  const [open, setOpen] = useState(false);

  const fmt = (n: number) => formatNumber(n, locale);
  const activeStudents = students.filter((s) => s.active).length;
  const upcoming = sessions.filter((s) => s.status === "upcoming");
  const monthlyIncome = payments.filter((p) => p.status === "paid").reduce((a, p) => a + p.amount, 0);
  const overdue = payments.filter((p) => p.status === "pending").length;

  const STATS = [
    { icon: Users, value: formatNumber(activeStudents, locale), label: t("activeStudents"), tint: "bg-[rgba(217,79,99,0.12)] text-[#B23A4C]" },
    { icon: CalendarDays, value: formatNumber(upcoming.length, locale), label: t("sessionsThisWeek"), tint: "bg-[rgba(214,142,60,0.16)] text-[#8A5A22]" },
    { icon: Wallet, value: fmt(monthlyIncome), label: t("monthlyIncome"), tint: "bg-[rgba(122,178,146,0.20)] text-[#2F6B4F]" },
    { icon: AlertCircle, value: formatNumber(overdue, locale), label: t("overduePayments"), tint: "bg-[rgba(217,79,99,0.12)] text-[#B23A4C]" },
  ];

  return (
    <Stagger>
      <StaggerItem>
        <PageHeader
          title={t("greeting")}
          subtitle={t("subtitle")}
          action={<Button icon={<Plus size={17} />} onClick={() => setOpen(true)}>{t("newSession")}</Button>}
        />
      </StaggerItem>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STATS.map((s) => (
          <StaggerItem key={s.label}>
            <Card hoverable>
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${s.tint}`}>
                <s.icon size={20} />
              </div>
              <p className="mt-4 text-2xl font-extrabold tracking-tight">{s.value}</p>
              <p className="mt-1 text-xs font-medium text-[var(--color-ink-soft)]">{s.label}</p>
            </Card>
          </StaggerItem>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <StaggerItem>
          <Card>
            <h2 className="mb-4 text-lg font-extrabold">{t("upcomingSessions")}</h2>
            <ul className="flex flex-col gap-3">
              {upcoming.slice(0, 3).map((se) => (
                <li key={se.id} className="flex items-center gap-4 rounded-2xl bg-white/25 px-4 py-3 transition-colors hover:bg-white/40">
                  <div className="flex h-14 w-14 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFE8C4] to-[#FFF4DE] shadow-inner">
                    <span className="text-[10px] font-bold text-[var(--color-ink-soft)]">{formatWeekday(se.date, locale)}</span>
                    <span className="text-xs font-extrabold">{formatTime(se.time, locale)}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold">{se.studentName}</p>
                    <p className="text-xs text-[var(--color-ink-soft)]">{formatDate(se.date, locale)} · {se.topic}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </StaggerItem>

        <StaggerItem>
          <Card>
            <h2 className="mb-4 text-lg font-extrabold">{t("latestPayments")}</h2>
            <ul className="divide-y divide-white/40">
              {payments.slice(0, 3).map((p) => (
                <li key={p.id} className="flex items-center justify-between py-3.5 text-sm">
                  <span className="font-bold">{p.studentName}</span>
                  <span className="text-[var(--color-ink-soft)]">{fmt(p.amount)} {t("toman")}</span>
                  <Badge tone={p.status === "paid" ? "success" : "danger"}>
                    {p.status === "paid" ? t("paid") : t("overdue")}
                  </Badge>
                </li>
              ))}
            </ul>
          </Card>
        </StaggerItem>
      </div>

      <NewSessionModal open={open} onClose={() => setOpen(false)} />
    </Stagger>
  );
}