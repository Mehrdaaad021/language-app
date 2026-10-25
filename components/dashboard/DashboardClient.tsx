"use client";

import { useTranslations } from "next-intl";
import { Users, Calendar, Wallet, AlertCircle } from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

type DashboardData = {
  greeting: string;
  subtitle: string;
  activeStudents: number;
  sessionsThisWeek: number;
  monthlyIncome: number;
  overduePayments: number;
  students: { id: string; name: string; level: string; term: string; active: boolean }[];
  sessions: { id: string; studentName: string; date: string; time: string; topic: string; status: string }[];
  payments: { id: string; studentName: string; amount: number; date: string; status: string }[];
};

export default function DashboardClient({ data }: { data: DashboardData }) {
  const t = useTranslations("Dashboard");

  const formatNumber = (n: number) => n.toLocaleString("fa-IR");
  const formatCurrency = (n: number) => `${formatNumber(n)} ${t("toman")}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold md:text-3xl">{data.greeting}</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">{data.subtitle}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(217,79,99,0.15)] text-[#D94F63]">
              <Users size={20} />
            </span>
            <div>
              <p className="text-xs font-bold text-[var(--color-ink-soft)]">{t("activeStudents")}</p>
              <p className="text-2xl font-extrabold">{data.activeStudents}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(166,216,186,0.25)] text-[#2F6B4F]">
              <Calendar size={20} />
            </span>
            <div>
              <p className="text-xs font-bold text-[var(--color-ink-soft)]">{t("sessionsThisWeek")}</p>
              <p className="text-2xl font-extrabold">{data.sessionsThisWeek}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(231,188,138,0.25)] text-[#8A5A22]">
              <Wallet size={20} />
            </span>
            <div>
              <p className="text-xs font-bold text-[var(--color-ink-soft)]">{t("monthlyIncome")}</p>
              <p className="text-2xl font-extrabold">{formatCurrency(data.monthlyIncome)}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(217,79,99,0.15)] text-[#D94F63]">
              <AlertCircle size={20} />
            </span>
            <div>
              <p className="text-xs font-bold text-[var(--color-ink-soft)]">{t("overduePayments")}</p>
              <p className="text-2xl font-extrabold">{data.overduePayments}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="mb-4 text-lg font-extrabold">{t("myStudents")}</h2>
        {data.students.length === 0 ? (
          <p className="py-8 text-center text-sm text-[var(--color-ink-soft)]">
            هنوز شاگردی اضافه نشده
          </p>
        ) : (
          <div className="space-y-2">
            {data.students.slice(0, 5).map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-xl bg-white/25 p-3">
                <div>
                  <p className="font-bold">{s.name}</p>
                  <p className="text-xs text-[var(--color-ink-soft)]">{s.level} — {s.term}</p>
                </div>
                <Badge tone={s.active ? "success" : "info"}>
                  {s.active ? "فعال" : "غیرفعال"}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}