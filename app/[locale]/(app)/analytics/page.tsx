import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Card from "@/components/ui/Card";

function fmtNum(n: number, locale: string): string {
  try {
    return new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US").format(n);
  } catch {
    return String(n);
  }
}

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSession();
  if (!session || session.role !== "TEACHER") redirect(`/${locale}/login`);

  const t = await getTranslations({ locale, namespace: "Analytics" });
  const fmt = (n: number) => fmtNum(n, locale);

  const workspace = await prisma.workspace.findFirst({
    where: { ownerId: session.sub },
    select: { id: true },
  });

  let payments: { amount: number; status: string; date: Date }[] = [];
  let sessions: { status: string }[] = [];
  let students: { level: string | null }[] = [];

  if (workspace) {
    try {
      const [p, s, st] = await Promise.all([
        prisma.payment.findMany({ where: { workspaceId: workspace.id } }),
        prisma.session.findMany({ where: { workspaceId: workspace.id } }),
        prisma.student.findMany({ where: { workspaceId: workspace.id } }),
      ]);
      payments = p;
      sessions = s;
      students = st;
    } catch {
      // DB error, arrays stay empty
    }
  }

  // ۶ ماه اخیر
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return {
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString(locale === "fa" ? "fa-IR" : "en-US", { month: "short" }),
    };
  });

  const income = months.map((m) =>
    payments
      .filter((p) => p.status === "PAID" && p.date.toISOString().startsWith(m.key))
      .reduce((a, p) => a + p.amount, 0)
  );
  const maxIncome = Math.max(...income, 1);
  const thisMonth = income[5] ?? 0;

  const scheduled = sessions.filter((s) => s.status === "SCHEDULED").length;
  const completed = sessions.filter((s) => s.status === "COMPLETED").length;
  const cancelled = sessions.filter((s) => s.status === "CANCELLED").length;

  const levels = students.reduce<Record<string, number>>((acc, s) => {
    const lvl = s.level ?? "—";
    acc[lvl] = (acc[lvl] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold md:text-3xl">{t("title")}</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">{t("subtitle")}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-xs font-bold text-[var(--color-ink-soft)]">{t("incomeThisMonth")}</p>
          <p className="mt-2 text-3xl font-extrabold">{fmt(thisMonth)}</p>
        </Card>
        <Card>
          <p className="text-xs font-bold text-[var(--color-ink-soft)]">{t("totalStudents")}</p>
          <p className="mt-2 text-3xl font-extrabold">{fmt(students.length)}</p>
        </Card>
        <Card>
          <p className="text-xs font-bold text-[var(--color-ink-soft)]">{t("totalSessions")}</p>
          <p className="mt-2 text-3xl font-extrabold">{fmt(sessions.length)}</p>
        </Card>
        <Card>
          <p className="text-xs font-bold text-[var(--color-ink-soft)]">{t("completedSessions")}</p>
          <p className="mt-2 text-3xl font-extrabold">{fmt(completed)}</p>
        </Card>
      </div>

      <Card>
        <h2 className="mb-4 text-lg font-extrabold">{t("incomeTrend")}</h2>
        <div className="flex h-48 items-end gap-2">
          {months.map((m, i) => {
            const height = (income[i] / maxIncome) * 100;
            return (
              <div key={m.key} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-[#D94F63] to-[#E8697B] transition-all"
                  style={{ height: `${Math.max(height, 4)}%` }}
                />
                <p className="text-[10px] font-bold text-[var(--color-ink-soft)]">{m.label}</p>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-lg font-extrabold">{t("sessionSplit")}</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">Scheduled</span>
              <Badge>{fmt(scheduled)}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">Completed</span>
              <Badge tone="success">{fmt(completed)}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">Cancelled</span>
              <Badge tone="warn">{fmt(cancelled)}</Badge>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-extrabold">{t("levelSplit")}</h2>
          <div className="space-y-2">
            {Object.entries(levels).map(([lvl, count]) => (
              <div key={lvl} className="flex items-center justify-between">
                <span className="text-sm font-bold">{lvl}</span>
                <Badge>{fmt(count)}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

import Badge from "@/components/ui/Badge";