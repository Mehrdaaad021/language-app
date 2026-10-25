import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Badge from "@/components/ui/Badge";

const FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
const toFa = (s: string) => s.replace(/\d/g, (d) => FA_DIGITS[Number(d)]);

function fmtNum(n: number, locale: string): string {
  try {
    return new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US").format(n);
  } catch {
    return String(n);
  }
}

const PINK = "bg-[#f8d8e0]";
const YELLOW = "bg-[#f6e7c6]";
const WHITE = "bg-[#fdfbf5]";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSession();
  if (!session || session.role !== "TEACHER") redirect(`/${locale}/login`);

  const t = await getTranslations({ locale, namespace: "Dashboard" });
  const tp = await getTranslations({ locale, namespace: "Pages" });
  const fmt = (n: number) => fmtNum(n, locale);

  /* ساعت: دقیقاً همون ساعتی که معلم ثبت کرده + اعداد یکدست فارسی/انگلیسی */
  const timeLabel = (d: Date) => {
    const hh = String(d.getUTCHours()).padStart(2, "0");
    const mm = String(d.getUTCMinutes()).padStart(2, "0");
    const raw = `${hh}:${mm}`;
    return locale === "fa" ? toFa(raw) : raw;
  };

  const workspace = await prisma.workspace.findFirst({
    where: { ownerId: session.sub },
    select: { id: true },
  });
  const workspaceId = workspace?.id ?? null;

  let students: { id: string; name: string; active: boolean }[] = [];
  let sessions: { id: string; topic: string | null; date: Date; status: string; student: { name: string } }[] = [];
  let payments: { id: string; amount: number; status: string; student: { name: string } }[] = [];

  if (workspaceId) {
    try {
      const [st, se, pa] = await Promise.all([
        prisma.student.findMany({ where: { workspaceId }, orderBy: { name: "asc" } }),
        prisma.session.findMany({ where: { workspaceId }, include: { student: true }, orderBy: { date: "desc" }, take: 6 }),
        prisma.payment.findMany({ where: { workspaceId }, include: { student: true }, orderBy: { date: "desc" }, take: 6 }),
      ]);
      students = st;
      sessions = se;
      payments = pa;
    } catch {
      // دیتابیس در دسترس نیست → آرایه‌ها خالی می‌مونن
    }
  }

  const activeStudents = students.filter((s) => s.active).length;
  const upcoming = sessions.filter((s) => s.status === "SCHEDULED");
  const monthlyIncome = payments.filter((p) => p.status === "PAID").reduce((a, p) => a + p.amount, 0);
  const overdue = payments.filter((p) => p.status === "PENDING").length;

  const STATS = [
    { label: t("activeStudents"), value: fmt(activeStudents), bg: PINK },
    { label: t("sessionsThisWeek"), value: fmt(upcoming.length), bg: PINK },
    { label: t("monthlyIncome"), value: fmt(monthlyIncome), bg: YELLOW, suffix: t("toman") },
    { label: t("overduePayments"), value: fmt(overdue), bg: WHITE },
  ];

  return (
    <div className="space-y-6">
      {/* هدر + دکمه‌های سریع */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold md:text-3xl">
            {t("greeting", { name: session.name ?? t("brand") })}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">{t("subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/payments"
            className="rounded-xl bg-[#f6c9d4] px-4 py-2.5 text-xs font-extrabold text-[#4a2430] shadow-sm transition hover:brightness-95"
          >
            {tp("addPayment")}
          </Link>
          <Link
            href="/sessions"
            className="rounded-xl bg-[#4a2430] px-4 py-2.5 text-xs font-extrabold text-[#f6eede] shadow-md transition hover:brightness-110"
          >
            + {tp("addSession")}
          </Link>
        </div>
      </div>

      {/* کارت‌های آمار پاستلی */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-5 shadow-[0_10px_30px_-18px_rgba(74,36,48,0.35)]`}>
            <p className="text-[11px] font-extrabold text-[#7c5a63]">{s.label}</p>
            <p className="mt-2 text-3xl font-extrabold text-[#40222c]">
              {s.value}
              {s.suffix && <span className="ms-1 text-xs font-bold text-[#7c5a63]">{s.suffix}</span>}
            </p>
          </div>
        ))}
      </div>

      {/* لیست‌ها */}
      <div className="grid gap-5 lg:grid-cols-2">
        <div className={`${WHITE} rounded-2xl p-5 shadow-[0_10px_30px_-18px_rgba(74,36,48,0.35)]`}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-extrabold">{t("upcomingSessions")}</h2>
            <Link href="/sessions" className="text-[11px] font-extrabold text-[#c2586b] underline">
              {tp("sessionsTitle")}
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--color-ink-soft)]">—</p>
          ) : (
            <div className="space-y-2">
              {upcoming.slice(0, 5).map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-xl bg-[#f7ecd9] p-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f8d8e0] text-sm font-extrabold text-[#4a2430]">
                      {s.student.name.charAt(0)}
                    </span>
                    <div>
                      <p className="text-sm font-extrabold">{s.student.name}</p>
                      <p className="text-[11px] text-[var(--color-ink-soft)]">{s.topic ?? "—"}</p>
                    </div>
                  </div>
                  <span className="rounded-lg bg-[#f6e7c6] px-2 py-1 text-[10px] font-extrabold text-[#4a2430]">
                    {timeLabel(s.date)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={`${WHITE} rounded-2xl p-5 shadow-[0_10px_30px_-18px_rgba(74,36,48,0.35)]`}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-extrabold">{t("latestPayments")}</h2>
            <Link href="/payments" className="text-[11px] font-extrabold text-[#c2586b] underline">
              {tp("paymentsTitle")}
            </Link>
          </div>
          {payments.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--color-ink-soft)]">—</p>
          ) : (
            <div className="space-y-2">
              {payments.slice(0, 5).map((p) => (
                <div
                  key={p.id}
                  className={`flex items-center justify-between rounded-xl p-3 ${
                    p.status === "PENDING" ? "bg-[#f8d8e0]" : "bg-[#f7ecd9]"
                  }`}
                >
                  <div>
                    <p className="text-sm font-extrabold">{p.student.name}</p>
                    <p className="text-[11px] text-[var(--color-ink-soft)]">
                      {fmt(p.amount)} {t("toman")}
                    </p>
                  </div>
                  <Badge tone={p.status === "PAID" ? "success" : "warn"}>
                    {p.status === "PAID" ? t("paid") : t("overdue")}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}