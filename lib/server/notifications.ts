"use server";

import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getTeacherWorkspace } from "./workspace";

export type AppNotification = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  tone: "info" | "warn";
};

export async function getTeacherNotifications(): Promise<AppNotification[]> {
  const ctx = await getTeacherWorkspace();
  if (!ctx) return [];

  const t = await getTranslations("Notifications");
  const now = new Date();
  const soon = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  const [sessions, payments] = await Promise.all([
    prisma.session.findMany({
      where: { workspaceId: ctx.workspaceId, status: "SCHEDULED", date: { gte: now, lte: soon } },
      include: { student: true },
    }),
    prisma.payment.findMany({
      where: { workspaceId: ctx.workspaceId, status: "PENDING", date: { lt: now } },
      include: { student: true },
    }),
  ]);

  const list: AppNotification[] = [
    ...sessions.map((s) => ({
      id: `session-${s.id}`,
      title: t("bell"),
      message: t("sessionSoon", { name: s.student.name }),
      createdAt: s.date.toISOString(),
      tone: "info" as const,
    })),
    ...payments.map((p) => ({
      id: `payment-${p.id}`,
      title: t("bell"),
      message: t("paymentOverdue", { name: p.student.name }),
      createdAt: p.date.toISOString(),
      tone: "warn" as const,
    })),
  ];

  return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}