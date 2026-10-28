"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { Note, Payment, Session, Student } from "@/lib/types";
import { getTeacherWorkspace, requireTeacherWorkspace } from "./workspace";
import { signAttachments } from "./upload-actions";

/* ── schemas ── */
const studentSchema = z.object({
  name: z.string().trim().min(1),
  phone: z.string().regex(/^09\d{9}$/).optional().or(z.literal("")).or(z.null()),
  email: z.string().email().optional().or(z.literal("")).or(z.null()),
  level: z.string().min(1),
  term: z.string().trim().min(1),
  active: z.boolean(),
});

const sessionSchema = z.object({
  studentName: z.string().min(1),
  topic: z.string().trim().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
});

const paymentSchema = z.object({
  studentName: z.string().min(1),
  amount: z.number().int().min(10000),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(["paid", "pending"]),
});

const noteSchema = z.object({
  studentId: z.string().min(1),
  title: z.string().trim().min(1),
  content: z.string().trim().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  attachments: z.array(
    z.object({ id: z.string(), name: z.string(), kind: z.enum(["image", "file"]), url: z.string() })
  ),
});

/* ── fetchAll: برای غیرمعلم‌ها داده‌ی خالی، برای معلم فقط workspace خودش ── */
export async function fetchAll() {
  const ctx = await getTeacherWorkspace();
  if (!ctx) {
    return { students: [], sessions: [], payments: [], notes: [] };
  }
  const { workspaceId } = ctx;

  const [students, sessions, payments, notes] = await Promise.all([
    prisma.student.findMany({ where: { workspaceId }, orderBy: { name: "asc" } }),
    prisma.session.findMany({ where: { workspaceId }, include: { student: true }, orderBy: { date: "desc" } }),
    prisma.payment.findMany({ where: { workspaceId }, include: { student: true }, orderBy: { date: "desc" } }),
    prisma.note.findMany({ where: { workspaceId }, orderBy: { date: "desc" } }),
  ]);

  return {
    students: students.map((s) => ({
      id: s.id,
      name: s.name,
      level: s.level ?? "—",
      term: s.term ?? "—",
      active: s.active,
      phone: s.phone ?? "",
      email: s.email ?? "",
    })),
    sessions: sessions.map((s) => ({
      id: s.id,
      studentName: s.student.name,
      date: s.date.toISOString().split("T")[0],
      time: s.date.toISOString().split("T")[1].slice(0, 5),
      topic: s.topic ?? "",
      status: (s.status === "SCHEDULED" ? "upcoming" : s.status === "COMPLETED" ? "completed" : "cancelled") as
        | "upcoming"
        | "completed"
        | "cancelled",
    })),
    payments: payments.map((p) => ({
      id: p.id,
      studentName: p.student.name,
      amount: p.amount,
      date: p.date.toISOString().split("T")[0],
      status: (p.status === "PAID" ? "paid" : "pending") as "paid" | "pending",
    })),
    notes: await Promise.all(
      notes.map(async (n) => ({
        id: n.id,
        studentId: n.studentId,
        title: n.title,
        content: n.content,
        date: n.date.toISOString().split("T")[0],
        attachments: await signAttachments(n.attachments),
      }))
    ),
  };
}

/* ── ایجاد شاگرد ── */
export async function createStudent(input: z.input<typeof studentSchema>): Promise<Student> {
  const { workspaceId } = await requireTeacherWorkspace();
  const d = studentSchema.parse(input);
  const row = await prisma.student.create({
    data: {
      workspaceId,
      name: d.name,
      phone: d.phone ?? null,
      email: d.email ?? null,
      level: d.level,
      term: d.term,
      active: d.active,
    },
  });
  return {
    id: row.id,
    name: row.name,
    level: row.level ?? "—",
    term: row.term ?? "—",
    active: row.active,
    phone: row.phone ?? "",
    email: row.email ?? "",
  };
}

/* ── ایجاد جلسه ── */
export async function createSession(input: z.input<typeof sessionSchema>): Promise<Session> {
  const { workspaceId } = await requireTeacherWorkspace();
  const d = sessionSchema.parse(input);
  const student = await prisma.student.findFirst({
    where: { workspaceId, name: d.studentName },
  });
  if (!student) throw new Error("STUDENT_NOT_FOUND");
  const row = await prisma.session.create({
    data: {
      workspaceId,
      studentId: student.id,
      date: new Date(`${d.date}T${d.time}:00.000Z`),
      topic: d.topic,
      status: "SCHEDULED",
    },
    include: { student: true },
  });
  return {
    id: row.id,
    studentName: row.student.name,
    date: d.date,
    time: d.time,
    topic: row.topic ?? "",
    status: "upcoming",
  };
}

/* ── ایجاد پرداخت (با ایمیل رسید) ── */
export async function createPayment(input: z.input<typeof paymentSchema>): Promise<Payment> {
  const { workspaceId } = await requireTeacherWorkspace();
  const d = paymentSchema.parse(input);
  const student = await prisma.student.findFirst({
    where: { workspaceId, name: d.studentName },
  });
  if (!student) throw new Error("STUDENT_NOT_FOUND");
  const row = await prisma.payment.create({
    data: {
      workspaceId,
      studentId: student.id,
      amount: d.amount,
      date: new Date(`${d.date}T00:00:00.000Z`),
      status: d.status === "paid" ? "PAID" : "PENDING",
    },
    include: { student: true },
  });

  // ارسال ایمیل رسید پرداخت (graceful: اگه شکست خورد، پرداخت همچنان ثبت می‌مونه)
  if (student.email) {
    try {
      const ws = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        include: { owner: true },
      });
      if (ws?.owner) {
        const faName = /[\u0600-\u06FF]/.test(ws.owner.name ?? "");
        const { sendPaymentReceipt } = await import("@/lib/email");
        await sendPaymentReceipt({
          to: student.email,
          studentName: student.name,
          amount: d.amount,
          date: d.date,
          status: d.status === "paid" ? "PAID" : "PENDING",
          locale: faName ? "fa" : "en",
        });
      }
    } catch (e) {
      console.error("[payment] email send failed:", e);
      // خطا رو swallow می‌کنیم — پرداخت همچنان ثبت شده
    }
  }

  return {
    id: row.id,
    studentName: row.student.name,
    amount: row.amount,
    date: d.date,
    status: d.status,
  };
}

/* ── ایجاد یادداشت ── */
export async function createNote(input: z.input<typeof noteSchema>): Promise<Note> {
  const { workspaceId } = await requireTeacherWorkspace();
  const d = noteSchema.parse(input);
  const student = await prisma.student.findFirst({
    where: { workspaceId, id: d.studentId },
  });
  if (!student) throw new Error("STUDENT_NOT_FOUND");
  const row = await prisma.note.create({
    data: {
      workspaceId,
      studentId: d.studentId,
      title: d.title,
      content: d.content,
      date: new Date(`${d.date}T00:00:00.000Z`),
      attachments: d.attachments as unknown as object[],
    },
  });
  return {
    id: row.id,
    studentId: row.studentId,
    title: row.title,
    content: row.content,
    date: d.date,
    attachments: d.attachments,
  };
}