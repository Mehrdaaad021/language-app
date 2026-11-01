import DemoDataButton from "@/components/onboarding/DemoDataButton";
import IncomeSparkline from "@/components/dashboard/IncomeSparkline";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Check, CalendarDays, GraduationCap, NotebookPen, Wallet, AlertTriangle, ShieldCheck, Mail } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Badge from "@/components/ui/Badge";
import { toJalali, toFa, JALALI_MONTHS_FA } from "@/lib/jalali";

const FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
const toFaStr = (s: string) => s.replace(/\d/g, (d) => FA_DIGITS[Number(d)]);

function fmtNum(n: number, locale: string): string {
  try {
    return new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US").format(n);
  } catch {
    return String(n);
  }
}

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
  const fa = locale === "fa";

  const timeLabel = (d: Date) => {
    const hh = String(d.getUTCHours()).padStart(2, "0");
    const mm = String(d.getUTCMinutes()).padStart(2, "0");
    const raw = `${hh}:${mm}`;
    return fa ? toFaStr(raw) : raw;
  };

  const workspace = await prisma.workspace.findFirst({
    where: { ownerId: session.sub },
    select: { id: true },
  });
  const workspaceId = workspace?.id ?? null;

  let students: { id: string; name: string; active: boolean }[] = [];
  let sessions: { id: string; topic: string | null; date: Date; status: string; student: { name: string } }[] = [];
  let payments: { id: string; amount: number; status: string; date: Date; student: { name: string } }[] = [];
  let notesCount = 0;

  if (workspaceId) {
    try {
      const [st, se, pa, nc] = await Promise.all([
        prisma.student.findMany({ where: { workspaceId }, orderBy: { name: "asc" } }),
        prisma.session.findMany({ where: { workspaceId }, include: { student: true }, orderBy: { date: "desc" }, take: 6 }),
        prisma.payment.findMany({ where: { workspaceId }, include: { student: true }, orderBy: { date: "desc" }, take: 6 }),
        prisma.note.count({ where: { workspaceId } }),
      ]);
      students = st;
      sessions = se;
      payments = pa;
      notesCount = nc;
    } catch {
      // دیتابیس در دسترس نیست
    }
  }

  const activeStudents = students.filter((s) => s.active).length;
  const upcoming = sessions.filter((s) => s.status === "SCHEDULED");
  const paidAll = payments.filter((p) => p.status === "PAID");
  const monthlyIncome = paidAll.reduce((a, p) => a + p.amount, 0);
  const overdue = payments.filter((p) => p.status === "PENDING").length;

  /* ── درآمد ۶ ماه اخیر برای نمودار ── */
  const chart: { label: string; total: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    const total = paidAll
      .filter((p) => p.date.getFullYear() === d.getFullYear() && p.date.getMonth() === d.getMonth())
      .reduce((a, p) => a + p.amount, 0);
    const label = fa
      ? JALALI_MONTHS_FA[toJalali(d.getFullYear(), d.getMonth() + 1, 1)[1] - 1]
      : d.toLocaleString("en-US", { month: "short" });
    chart.push({ label, total });
  }

  /* ── آن‌بردینگ ── */
  const steps = [
    { done: students.length > 0, href: "/students", title: fa ? "اولین شاگرد رو اضافه کن" : "Add your first student", hint: fa ? "پروفایل، سطح و ترم شاگرد رو ثبت کن." : "Record their profile, level and term." },
    { done: sessions.length > 0, href: "/sessions", title: fa ? "اولین جلسه رو ثبت کن" : "Schedule your first session", hint: fa ? "تاریخ، ساعت و موضوع جلسه رو مشخص کن." : "Set the date, time and topic." },
    { done: payments.length > 0, href: "/payments", title: fa ? "اولین پرداخت رو ثبت کن" : "Record your first payment", hint: fa ? "مبلغ و وضعیت پرداخت رو روشن کن." : "Clarify the amount and status." },
  ];
  const doneCount = steps.filter((s) => s.done).length;

  const indicators = [
    { icon: GraduationCap, label: t("activeStudents"), value: fmt(activeStudents), tint: "bg-[#f8d8e0] text-[#c2586b]" },
    { icon: CalendarDays, label: t("sessionsThisWeek"), value: fmt(upcoming.length), tint: "bg-[#f6e7c6] text-[#b3701f]" },
    { icon: NotebookPen, label: fa ? "یادداشت‌ها" : "Notes", value: fmt(notesCount), tint: "bg-[#e5dff2] text-[#7a5ba6]" },
    { icon: AlertTriangle, label: t("overduePayments"), value: fmt(overdue), tint: "bg-[#f6d2ce] text-[#b3261e]" },
  ];

  return (
    <div className="space-y-6">
      {/* هدر */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold md:text-3xl">
            {t("greeting", { name: session.name ?? t("brand") })}
          </h1>
          <p className="mt-1 text-sm text-[var(--c-ink-soft)]">{t("subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/payments"
            className="rounded-full bg-[var(--c-pink-strong)] px-5 py-2.5 text-xs font-extrabold text-[var(--c-primary)] shadow-sm transition hover:brightness-95"
          >
            {tp("addPayment")}
          </Link>
          <Link
            href="/sessions"
            className="btn-primary rounded-full px-5 py-2.5 text-xs font-extrabold shadow-md transition"
          >
            + {tp("addSession")}
          </Link>
        </div>
      </div>

      {/* آن‌بردینگ */}
      {doneCount < 3 && (
        <div className="card-lux p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-extrabold">{fa ? "راه‌اندازی کلاس" : "Set up your class"}</h2>
              <p className="mt-0.5 text-xs text-[var(--c-ink-soft)]">
                {fa ? "سه قدم تا کامل‌شدن پرونده‌ی کلاس‌ت:" : "Three steps to complete your class profile:"}
              </p>
            </div>
            <span className="chip-lux bg-[var(--c-pink)] text-[var(--c-primary)]">
              {fa ? `${toFaStr(String(doneCount))} از ${toFaStr("3")} انجام شد` : `${doneCount} of 3 done`}
            </span>
          </div>

          <div className="progress-track mt-4">
            <div className="progress-fill" style={{ width: `${(doneCount / 3) * 100}%` }} />
          </div>

          <div className="mt-4 space-y-2">
            {steps.map((s, i) => (
              <div
                key={s.href}
                className={`flex items-center justify-between rounded-2xl p-3 ${
                  s.done ? "bg-[var(--c-success-bg)]" : "bg-[var(--c-surface-2)]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${
                      s.done ? "bg-[var(--c-success)] text-white" : "bg-white/60 text-[var(--c-ink-soft)]"
                    }`}
                  >
                    {s.done ? <Check size={14} /> : fa ? toFaStr(String(i + 1)) : i + 1}
                  </span>
                  <div>
                    <p className={`text-sm font-extrabold ${s.done ? "line-through opacity-60" : ""}`}>{s.title}</p>
                    <p className="text-[11px] text-[var(--c-ink-soft)]">{s.hint}</p>
                  </div>
                </div>
                {!s.done && (
                  <Link href={s.href} className="btn-primary rounded-xl px-3 py-1.5 text-[10px] font-extrabold">
                    {fa ? "انجام بده" : "Do it"}
                  </Link>
                )}
              </div>
            ))}
          </div>

          {doneCount === 0 && <DemoDataButton locale={locale} />}
        </div>
      )}

      {/* ── Bento Grid ── */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* کارت پروفایل */}
        <div className="card-lux flex flex-col justify-between p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#e8697b] to-[#d94f63] text-xl font-extrabold text-white shadow-lg">
              {(session.name ?? "T").charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-extrabold">{session.name ?? t("brand")}</p>
              <p className="truncate text-xs text-[var(--c-ink-soft)]">{session.email}</p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="chip-lux bg-[#f8d8e0] text-[#c2586b]">
              <GraduationCap size={12} /> {fa ? "معلم" : "Teacher"}
            </span>
            <span className="chip-lux bg-[#e0f0e6] text-[#2f7a55]">
              <ShieldCheck size={12} /> {fa ? "حساب فعال" : "Active"}
            </span>
            <span className="chip-lux bg-[#e5dff2] text-[#7a5ba6]">
              <Mail size={12} /> {fa ? "ایمیل خودکار" : "Auto email"}
            </span>
          </div>
        </div>

        {/* کارت وضعیت کلاس */}
        <div className="card-lux p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold">{fa ? "وضعیت کلاس" : "Class status"}</h2>
            <span className="chip-lux bg-[var(--c-pink)] text-[var(--c-primary)]">
              {fa ? `${toFaStr(String(students.length))} شاگرد` : `${students.length} students`}
            </span>
          </div>

          <div className="mt-5">
            <div className="mb-1.5 flex items-center justify-between text-xs font-bold text-[var(--c-ink-soft)]">
              <span>{fa ? "شاگردهای فعال" : "Active students"}</span>
              <span>
                {fa
                  ? `${toFaStr(String(activeStudents))} / ${toFaStr(String(students.length))}`
                  : `${activeStudents} / ${students.length}`}
              </span>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${students.length ? (activeStudents / students.length) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-[#f8d8e0]/70 p-3 text-center">
              <p className="text-xl font-extrabold text-[#40222c]">{fmt(upcoming.length)}</p>
              <p className="mt-0.5 text-[10px] font-bold text-[#7c5a63]">{fa ? "جلسه‌ی پیش رو" : "Upcoming"}</p>
            </div>
            <div className="rounded-2xl bg-[#f6e7c6]/70 p-3 text-center">
              <p className="text-xl font-extrabold text-[#40222c]">{fmt(notesCount)}</p>
              <p className="mt-0.5 text-[10px] font-bold text-[#7c5a63]">{fa ? "یادداشت" : "Notes"}</p>
            </div>
            <div className="rounded-2xl bg-[#f6d2ce]/70 p-3 text-center">
              <p className="text-xl font-extrabold text-[#40222c]">{fmt(overdue)}</p>
              <p className="mt-0.5 text-[10px] font-bold text-[#7c5a63]">{fa ? "معوق" : "Overdue"}</p>
            </div>
          </div>
        </div>

        {/* کارت نمودار درآمد */}
        <div className="card-lux p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-extrabold">{fa ? "روند درآمد" : "Income trend"}</h2>
            <span className="chip-lux bg-[#e0f0e6] text-[#2f7a55]">
              <Wallet size={12} /> {fmt(monthlyIncome)} {t("toman")}
            </span>
          </div>
          <IncomeSparkline
            points={chart.map((c) => c.total)}
            labels={chart.map((c) => (fa ? toFaStr(c.label) : c.label))}
          />
        </div>

        {/* کارت شاخص‌های کلیدی */}
        <div className="card-lux p-6">
          <h2 className="mb-4 text-base font-extrabold">{fa ? "شاخص‌های کلیدی" : "Key indicators"}</h2>
          <div className="grid grid-cols-2 gap-3">
            {indicators.map((ind, i) => {
              const Icon = ind.icon;
              return (
                <div key={i} className="rounded-2xl bg-[var(--c-surface-2)] p-3 transition hover:bg-[var(--c-surface-2)]/70">
                  <span className={`inline-flex h-8 w-8 items-center justify-center rounded-xl ${ind.tint}`}>
                    <Icon size={15} />
                  </span>
                  <p className="mt-2 text-lg font-extrabold tabular-nums">{ind.value}</p>
                  <p className="text-[10px] font-bold text-[var(--c-ink-soft)]">{ind.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* لیست‌ها */}
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="card-lux p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-extrabold">{t("upcomingSessions")}</h2>
            <Link href="/sessions" className="text-[11px] font-extrabold text-[#c2586b] underline">
              {tp("sessionsTitle")}
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--c-ink-soft)]">—</p>
          ) : (
            <div className="space-y-2">
              {upcoming.slice(0, 5).map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-2xl bg-[var(--c-surface-2)] p-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f8d8e0] text-sm font-extrabold text-[#4a2430]">
                      {s.student.name.charAt(0)}
                    </span>
                    <div>
                      <p className="text-sm font-extrabold">{s.student.name}</p>
                      <p className="text-[11px] text-[var(--c-ink-soft)]">{s.topic ?? "—"}</p>
                    </div>
                  </div>
                  <span className="rounded-xl bg-[#f6e7c6] px-2 py-1 text-[10px] font-extrabold tabular-nums">
                    {timeLabel(s.date)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card-lux p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-extrabold">{t("latestPayments")}</h2>
            <Link href="/payments" className="text-[11px] font-extrabold text-[#c2586b] underline">
              {tp("paymentsTitle")}
            </Link>
          </div>
          {payments.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--c-ink-soft)]">—</p>
          ) : (
            <div className="space-y-2">
              {payments.slice(0, 5).map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-2xl bg-[var(--c-surface-2)] p-3">
                  <div>
                    <p className="text-sm font-extrabold">{p.student.name}</p>
                    <p className="text-[11px] text-[var(--c-ink-soft)]">
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