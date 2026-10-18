import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CalendarDays, Wallet, NotebookPen } from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { Stagger, StaggerItem } from "@/components/ui/Reveal";
import { getSession } from "@/lib/auth";
import { loadStudentArea } from "@/lib/server/queries";
import { formatNumber, formatDate, formatTime, formatWeekday } from "@/lib/format";

export default async function StudentDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Student" });
  const session = await getSession();
  if (!session || session.role !== "STUDENT") redirect(`/${locale}/login`);

  const bundle = await loadStudentArea(session.sub);
  if (!bundle) return null;

  const upcoming = bundle.sessions.filter((s) => s.status === "upcoming");
  const paid = bundle.payments.filter((p) => p.status === "paid").reduce((a, p) => a + p.amount, 0);

  const STATS = [
    { icon: CalendarDays, value: formatNumber(upcoming.length, locale), label: t("upcomingSessions"), tint: "bg-[rgba(214,142,60,0.16)] text-[#8A5A22]" },
    { icon: Wallet, value: formatNumber(paid, locale), label: t("totalPaid"), tint: "bg-[rgba(122,178,146,0.20)] text-[#2F6B4F]" },
    { icon: NotebookPen, value: formatNumber(bundle.notes.length, locale), label: t("notebookPages"), tint: "bg-[rgba(217,79,99,0.12)] text-[#B23A4C]" },
  ];

  return (
    <Stagger>
      <StaggerItem>
        <header className="mb-8">
          <h1 className="text-2xl font-extrabold md:text-3xl">{t("greeting", { name: bundle.student.name })}</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">{t("subtitle")}</p>
        </header>
      </StaggerItem>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
            <h2 className="mb-4 text-lg font-extrabold">{t("sessionsList")}</h2>
            <ul className="flex flex-col gap-3">
              {bundle.sessions.slice(0, 5).map((se) => (
                <li key={se.id} className="flex items-center gap-4 rounded-2xl bg-white/25 px-4 py-3">
                  <div className="flex h-12 w-12 flex-col items-center justify-center rounded-xl bg-gradient-to-br from-[#FFE8C4] to-[#FFF4DE] shadow-inner">
                    <span className="text-[9px] font-bold text-[var(--color-ink-soft)]">{formatWeekday(se.date, locale)}</span>
                    <span className="text-[11px] font-extrabold">{formatTime(se.time, locale)}</span>
                  </div>
                  <p className="flex-1 truncate text-sm font-bold">{se.topic}</p>
                  <Badge tone={se.status === "upcoming" ? "info" : se.status === "completed" ? "success" : "danger"}>
                    {se.status === "upcoming" ? t("upcoming") : se.status === "completed" ? t("completed") : t("cancelled")}
                  </Badge>
                </li>
              ))}
            </ul>
          </Card>
        </StaggerItem>

        <StaggerItem>
          <Card>
            <h2 className="mb-4 text-lg font-extrabold">{t("paymentsList")}</h2>
            <ul className="divide-y divide-white/40">
              {bundle.payments.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-3.5 text-sm">
                  <span className="text-xs text-[var(--color-ink-soft)]">{formatDate(p.date, locale)}</span>
                  <span className="font-semibold text-[var(--color-ink-soft)]">
                    {formatNumber(p.amount, locale)} {t("toman")}
                  </span>
                  <Badge tone={p.status === "paid" ? "success" : "warn"}>
                    {p.status === "paid" ? t("paid") : t("pending")}
                  </Badge>
                </li>
              ))}
            </ul>
          </Card>
        </StaggerItem>
      </div>
    </Stagger>
  );
}