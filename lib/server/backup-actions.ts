"use server";

import { prisma } from "@/lib/prisma";
import { requireTeacherWorkspace } from "./workspace";

export type BackupData = {
  version: 1;
  app: "language-class-assistant";
  exportedAt: string;
  students: Record<string, unknown>[];
  sessions: Record<string, unknown>[];
  payments: Record<string, unknown>[];
  notes: Record<string, unknown>[];
};

/* ── خروجی کامل JSON از workspace ── */
export async function exportBackup(): Promise<
  { ok: true; data: BackupData } | { ok: false; error: string }
> {
  const { workspaceId } = await requireTeacherWorkspace();

  const [students, sessions, payments, notes] = await Promise.all([
    prisma.student.findMany({ where: { workspaceId } }),
    prisma.session.findMany({ where: { workspaceId } }),
    prisma.payment.findMany({ where: { workspaceId } }),
    prisma.note.findMany({ where: { workspaceId } }),
  ]);

  // تبدیل Date ها به ISO string
  const json = (rows: unknown[]) => JSON.parse(JSON.stringify(rows));

  return {
    ok: true,
    data: {
      version: 1,
      app: "language-class-assistant",
      exportedAt: new Date().toISOString(),
      students: json(students),
      sessions: json(sessions),
      payments: json(payments),
      notes: json(notes),
    },
  };
}

/* ── بازیابی: جایگزینی کامل داده‌های workspace ── */
export async function importBackup(input: unknown): Promise<
  { ok: true; counts: { students: number; sessions: number; payments: number; notes: number } } | { ok: false; error: string }
> {
  const { workspaceId } = await requireTeacherWorkspace();

  if (typeof input !== "object" || input === null) return { ok: false, error: "INVALID" };
  const d = input as Partial<BackupData>;
  if (d.app !== "language-class-assistant" || !Array.isArray(d.students)) {
    return { ok: false, error: "INVALID" };
  }

  const students = d.students as Record<string, unknown>[];
  const sessions = (Array.isArray(d.sessions) ? d.sessions : []) as Record<string, unknown>[];
  const payments = (Array.isArray(d.payments) ? d.payments : []) as Record<string, unknown>[];
  const notes = (Array.isArray(d.notes) ? d.notes : []) as Record<string, unknown>[];

  const studentIds = new Set(students.map((s) => String(s.id)));
  const date = (v: unknown) => (v ? new Date(String(v)) : new Date());
  const str = (v: unknown, fallback: string | null = null) =>
    v === null || v === undefined ? fallback : String(v);

  const counts = await prisma.$transaction(async (tx) => {
    /* پاک‌سازی داده‌های فعلی (ترتیب مهمه: اول فرزندها) */
    await tx.note.deleteMany({ where: { workspaceId } });
    await tx.session.deleteMany({ where: { workspaceId } });
    await tx.payment.deleteMany({ where: { workspaceId } });
    await tx.student.deleteMany({ where: { workspaceId } });

    /* شاگردها */
    for (const s of students) {
      await tx.student.create({
        data: {
          id: String(s.id),
          workspaceId,
          name: String(s.name ?? "—"),
          phone: str(s.phone),
          email: str(s.email),
          level: str(s.level),
          term: str(s.term),
          active: typeof s.active === "boolean" ? s.active : true,
          userId: str(s.userId),
          inviteToken: str(s.inviteToken),
          invitedAt: s.invitedAt ? date(s.invitedAt) : null,
          inviteExpiresAt: s.inviteExpiresAt ? date(s.inviteExpiresAt) : null,
          createdAt: s.createdAt ? date(s.createdAt) : new Date(),
        },
      });
    }

    /* جلسات */
    let sc = 0;
    for (const s of sessions) {
      const studentId = String(s.studentId);
      if (!studentIds.has(studentId)) continue;
      await tx.session.create({
        data: {
          id: String(s.id),
          workspaceId,
          studentId,
          date: date(s.date),
          topic: str(s.topic),
          status: (str(s.status, "SCHEDULED") as "SCHEDULED" | "COMPLETED" | "CANCELLED") ?? "SCHEDULED",
          createdAt: s.createdAt ? date(s.createdAt) : new Date(),
        },
      });
      sc++;
    }

    /* پرداخت‌ها */
    let pc = 0;
    for (const p of payments) {
      const studentId = String(p.studentId);
      if (!studentIds.has(studentId)) continue;
      await tx.payment.create({
        data: {
          id: String(p.id),
          workspaceId,
          studentId,
          amount: Number(p.amount ?? 0),
          date: date(p.date),
          status: (str(p.status, "PENDING") as "PENDING" | "PAID" | "OVERDUE") ?? "PENDING",
          createdAt: p.createdAt ? date(p.createdAt) : new Date(),
        },
      });
      pc++;
    }

    /* یادداشت‌ها */
    let nc = 0;
    for (const n of notes) {
      const studentId = String(n.studentId);
      if (!studentIds.has(studentId)) continue;
      await tx.note.create({
        data: {
          id: String(n.id),
          workspaceId,
          studentId,
          title: String(n.title ?? "—"),
          content: String(n.content ?? ""),
          date: date(n.date),
          attachments: (Array.isArray(n.attachments) ? n.attachments : []) as object[],
          createdAt: n.createdAt ? date(n.createdAt) : new Date(),
        },
      });
      nc++;
    }

    return { students: students.length, sessions: sc, payments: pc, notes: nc };
  });

  return { ok: true, counts };
}