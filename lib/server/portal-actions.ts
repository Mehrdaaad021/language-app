"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { requireTeacherWorkspace } from "./workspace";
/* ── نوع مشترک تکلیف (shared type) ── */
export type HomeworkItem = {
  id: string;
  studentName?: string;
  title: string;
  description: string;
  dueDate: string | null;
  status: string;
  submissionText: string;
  feedback: string;
  score: number | null;
};
/* ── helper: شاگرد لاگین‌شده + student row مربوطه ── */
async function requireStudentRow() {
  const session = await getSession();
  if (!session || session.role !== "STUDENT") throw new Error("NOT_STUDENT");
  const student = await prisma.student.findFirst({
    where: { userId: session.sub },
    include: { workspace: { include: { owner: true } } },
  });
  if (!student) throw new Error("STUDENT_NOT_FOUND");
  return { session, student };
}

/* ═══════════ ۱) تأیید حضور شاگرد ═══════════ */
export async function confirmAttendance(sessionId: string): Promise<{ ok: boolean; error?: string }> {
  const { student } = await requireStudentRow();
  const row = await prisma.session.findFirst({
    where: { id: sessionId, studentId: student.id },
  });
  if (!row) return { ok: false, error: "NOT_FOUND" };
  if (row.studentConfirmed) return { ok: false, error: "ALREADY" };

  await prisma.session.update({
    where: { id: sessionId },
    data: { studentConfirmed: true, confirmedAt: new Date() },
  });

  // نوتیفیکیشن برای معلم
  const owner = student.workspace?.owner;
  if (owner) {
    await prisma.notification.create({
      data: {
        userId: owner.id,
        title: "تأیید حضور",
        message: `${student.name} حضور در جلسه‌ی ${row.date.toISOString().split("T")[0]} را تأیید کرد.`,
      },
    });
  }
  return { ok: true };
}

/* ═══════════ ۲) تکلیف: ساخت توسط معلم ═══════════ */
const homeworkSchema = z.object({
  studentId: z.string().min(1),
  title: z.string().trim().min(1),
  description: z.string().trim().optional().or(z.literal("")),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
});

export async function createHomework(input: z.input<typeof homeworkSchema>): Promise<{ ok: boolean; error?: string }> {
  const { workspaceId } = await requireTeacherWorkspace();
  const d = homeworkSchema.parse(input);
  const student = await prisma.student.findFirst({ where: { id: d.studentId, workspaceId } });
  if (!student) return { ok: false, error: "STUDENT_NOT_FOUND" };

  await prisma.homework.create({
    data: {
      workspaceId,
      studentId: d.studentId,
      title: d.title,
      description: d.description ?? "",
      dueDate: d.dueDate ? new Date(`${d.dueDate}T23:59:59.000Z`) : null,
    },
  });

  if (student.userId) {
    await prisma.notification.create({
      data: {
        userId: student.userId,
        title: "تکلیف جدید",
        message: `«${d.title}» برای تو ثبت شد.`,
      },
    });
  }
  return { ok: true };
}

/* ═══════════ ۳) تکلیف: تحویل توسط شاگرد ═══════════ */
export async function submitHomework(homeworkId: string, text: string): Promise<{ ok: boolean; error?: string }> {
  const { student } = await requireStudentRow();
  const row = await prisma.homework.findFirst({
    where: { id: homeworkId, studentId: student.id },
  });
  if (!row) return { ok: false, error: "NOT_FOUND" };
  if (row.status === "GRADED") return { ok: false, error: "GRADED" };
  if (!text.trim()) return { ok: false, error: "EMPTY" };

  await prisma.homework.update({
    where: { id: homeworkId },
    data: { submissionText: text.trim(), submittedAt: new Date(), status: "SUBMITTED" },
  });

  const owner = student.workspace?.owner;
  if (owner) {
    await prisma.notification.create({
      data: {
        userId: owner.id,
        title: "تحویل تکلیف",
        message: `${student.name} تکلیف «${row.title}» را تحویل داد.`,
      },
    });
  }
  return { ok: true };
}

/* ═══════════ ۴) تکلیف: نمره + بازخورد توسط معلم ═══════════ */
export async function gradeHomework(
  homeworkId: string,
  score: number | null,
  feedback: string
): Promise<{ ok: boolean; error?: string }> {
  const { workspaceId } = await requireTeacherWorkspace();
  const row = await prisma.homework.findFirst({ where: { id: homeworkId, workspaceId } });
  if (!row) return { ok: false, error: "NOT_FOUND" };
  if (score !== null && (score < 0 || score > 20)) return { ok: false, error: "SCORE_RANGE" };

  await prisma.homework.update({
    where: { id: homeworkId },
    data: { score, feedback: feedback.trim(), status: "GRADED" },
  });

  const student = await prisma.student.findUnique({ where: { id: row.studentId } });
  if (student?.userId) {
    await prisma.notification.create({
      data: {
        userId: student.userId,
        title: "نمره‌ی تکلیف",
        message: `تکلیف «${row.title}» تصحیح شد${score !== null ? ` — نمره: ${score}/20` : ""}.`,
      },
    });
  }
  return { ok: true };
}

/* ═══════════ ۵) نمره‌ی جلسه توسط معلم ═══════════ */
export async function setSessionScore(sessionId: string, score: number | null): Promise<{ ok: boolean; error?: string }> {
  const { workspaceId } = await requireTeacherWorkspace();
  const row = await prisma.session.findFirst({ where: { id: sessionId, workspaceId } });
  if (!row) return { ok: false, error: "NOT_FOUND" };
  if (score !== null && (score < 0 || score > 20)) return { ok: false, error: "SCORE_RANGE" };

  await prisma.session.update({ where: { id: sessionId }, data: { score } });

  const student = await prisma.student.findUnique({ where: { id: row.studentId } });
  if (student?.userId && score !== null) {
    await prisma.notification.create({
      data: {
        userId: student.userId,
        title: "نمره‌ی جلسه",
        message: `نمره‌ی جلسه‌ی ${row.date.toISOString().split("T")[0]}: ${score}/20`,
      },
    });
  }
  return { ok: true };
}

/* ═══════════ ۶) پیام‌ها ═══════════ */
export async function sendMessage(studentId: string, text: string): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (!session) throw new Error("NOT_AUTHED");
  const trimmed = text.trim();
  if (!trimmed || trimmed.length > 500) return { ok: false, error: "LENGTH" };

  if (session.role === "TEACHER") {
    const { workspaceId } = await requireTeacherWorkspace();
    const student = await prisma.student.findFirst({ where: { id: studentId, workspaceId } });
    if (!student) return { ok: false, error: "NOT_FOUND" };
    await prisma.message.create({
      data: { workspaceId, studentId, sender: "TEACHER", text: trimmed },
    });
    if (student.userId) {
      await prisma.notification.create({
        data: { userId: student.userId, title: "پیام جدید", message: trimmed.slice(0, 80) },
      });
    }
    return { ok: true };
  }

  if (session.role === "STUDENT") {
    const student = await prisma.student.findFirst({
      where: { userId: session.sub },
      include: { workspace: { include: { owner: true } } },
    });
    if (!student || student.id !== studentId) return { ok: false, error: "NOT_FOUND" };

    // guard: workspaceId در schema nullable هست → اول مطمئن شو مقدار داره
    const wsId = student.workspaceId;
    if (!wsId) return { ok: false, error: "NO_WORKSPACE" };

    await prisma.message.create({
      data: { workspaceId: wsId, studentId, sender: "STUDENT", text: trimmed },
    });
    const owner = student.workspace?.owner;
    if (owner) {
      await prisma.notification.create({
        data: { userId: owner.id, title: "پیام شاگرد", message: `${student.name}: ${trimmed.slice(0, 60)}` },
      });
    }
    return { ok: true };
  }

  return { ok: false, error: "ROLE" };
}

export async function markThreadRead(studentId: string): Promise<{ ok: boolean }> {
  const session = await getSession();
  if (!session) return { ok: false };
  const reader = session.role === "TEACHER" ? "STUDENT" : "TEACHER";
  await prisma.message.updateMany({
    where: { studentId, sender: reader, readAt: null },
    data: { readAt: new Date() },
  });
  return { ok: true };
}

/* ═══════════ ۷) Fetchers ═══════════ */

export async function getMyPortalExtras() {
  const { student } = await requireStudentRow();
  const [homeworks, messages, sessions] = await Promise.all([
    prisma.homework.findMany({ where: { studentId: student.id }, orderBy: { createdAt: "desc" } }),
    prisma.message.findMany({ where: { studentId: student.id }, orderBy: { createdAt: "asc" }, take: 100 }),
    prisma.session.findMany({
      where: { studentId: student.id },
      orderBy: { date: "desc" },
      take: 20,
    }),
  ]);
  return {
    studentId: student.id,
          homeworks: homeworks.map((h) => ({
      id: h.id,
      title: h.title,
      description: h.description || "",
      dueDate: h.dueDate?.toISOString().split("T")[0] ?? null,
      status: h.status,
      submissionText: h.submissionText || "",
      feedback: h.feedback || "",
      score: h.score,
    })),
    messages: messages.map((m) => ({
      id: m.id,
      sender: m.sender,
      text: m.text,
      createdAt: m.createdAt.toISOString(),
    })),
    sessions: sessions.map((s) => ({
      id: s.id,
      date: s.date.toISOString().split("T")[0],
      time: s.date.toISOString().split("T")[1].slice(0, 5),
      topic: s.topic ?? "",
      status: s.status,
      score: s.score,
      studentConfirmed: s.studentConfirmed,
    })),
  };
}

export async function getTeacherHomeworks() {
  const { workspaceId } = await requireTeacherWorkspace();
  const rows = await prisma.homework.findMany({
    where: { workspaceId },
    include: { student: true },
    orderBy: { createdAt: "desc" },
  });
    return rows.map((h) => ({
    id: h.id,
    studentName: h.student.name,
    title: h.title,
    description: h.description || "",
    dueDate: h.dueDate?.toISOString().split("T")[0] ?? null,
    status: h.status,
    submissionText: h.submissionText || "",
    feedback: h.feedback || "",
    score: h.score,
  }));
}

export async function getTeacherThreads() {
  const { workspaceId } = await requireTeacherWorkspace();
  const students = await prisma.student.findMany({ where: { workspaceId }, orderBy: { name: "asc" } });
  const threads = await Promise.all(
    students.map(async (s) => {
      const [last, unread] = await Promise.all([
        prisma.message.findFirst({ where: { studentId: s.id }, orderBy: { createdAt: "desc" } }),
        prisma.message.count({ where: { studentId: s.id, sender: "STUDENT", readAt: null } }),
      ]);
      return {
        studentId: s.id,
        studentName: s.name,
        lastText: last?.text ?? "",
        lastAt: last?.createdAt.toISOString() ?? null,
        unread,
      };
    })
  );
  return threads;
}

export async function getThreadMessages(studentId: string) {
  const { workspaceId } = await requireTeacherWorkspace();
  const rows = await prisma.message.findMany({
    where: { studentId, workspaceId },
    orderBy: { createdAt: "asc" },
    take: 200,
  });
  return rows.map((m) => ({
    id: m.id,
    sender: m.sender,
    text: m.text,
    createdAt: m.createdAt.toISOString(),
  }));
}