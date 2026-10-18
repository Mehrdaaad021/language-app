"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export type AppNotification = {
  id: string;
  kind: "session" | "payment";
  titleKey: "sessionSoon" | "paymentOverdue";
  name: string;
  href: string;
};

export async function getTeacherNotifications(): Promise<AppNotification[]> {
  const session = await getSession();
  if (!session || session.role !== "TEACHER") return [];

  const now = Date.now();
  const in48h = now + 48 * 3600 * 1000;

  const [sessions, payments] = await Promise.all([
    prisma.session.findMany({
      where: { status: "SCHEDULED", date: { gte: new Date(now), lte: new Date(in48h) } },
      include: { student: true },
    }),
    prisma.payment.findMany({
      where: { status: { in: ["PENDING", "OVERDUE"] } },
      include: { student: true },
    }),
  ]);

  return [
    ...sessions.map((s): AppNotification => ({
      id: `se-${s.id}`,
      kind: "session",
      titleKey: "sessionSoon",
      name: s.student.name,
      href: "/sessions",
    })),
    ...payments.map((p): AppNotification => ({
      id: `pay-${p.id}`,
      kind: "payment",
      titleKey: "paymentOverdue",
      name: p.student.name,
      href: "/payments",
    })),
  ];
}