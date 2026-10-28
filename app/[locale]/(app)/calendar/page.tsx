import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import MonthlyCalendar from "@/components/sessions/MonthlyCalendar";
import CalendarClient from "@/components/sessions/CalendarClient";

type SessionItem = {
  id: string;
  studentName: string;
  date: string;
  time: string;
  topic: string;
  status: "upcoming" | "completed" | "cancelled";
};

export default async function CalendarPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSession();
  if (!session || session.role !== "TEACHER") redirect(`/${locale}/login`);

  const t = await getTranslations({ locale, namespace: "Pages" });

  const workspace = await prisma.workspace.findFirst({
    where: { ownerId: session.sub },
    select: { id: true },
  });

  const sessions = workspace
    ? await prisma.session.findMany({
        where: { workspaceId: workspace.id },
        include: { student: true },
        orderBy: { date: "asc" },
      })
    : [];

  const mapped: SessionItem[] = sessions.map((s) => {
    let status: SessionItem["status"];
    if (s.status === "SCHEDULED") status = "upcoming";
    else if (s.status === "COMPLETED") status = "completed";
    else status = "cancelled";

    return {
      id: s.id,
      studentName: s.student.name,
      date: s.date.toISOString().split("T")[0],
      time: s.date.toISOString().split("T")[1].slice(0, 5),
      topic: s.topic ?? "",
      status,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold md:text-3xl">{t("calendarTitle")}</h1>
        <p className="mt-1 text-sm text-[var(--c-ink-soft)]">{t("calendarSubtitle")}</p>
      </div>

      <MonthlyCalendar sessions={mapped} />

      <CalendarClient sessions={mapped} />
    </div>
  );
}