"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { Attachment, Note, Payment, Session, Student } from "@/lib/types";

const day = (d: Date) => d.toISOString().slice(0, 10);
const timeOf = (d: Date) => d.toISOString().slice(11, 16);

const SESSION_STATUS = { SCHEDULED: "upcoming", COMPLETED: "completed", CANCELLED: "cancelled" } as const;
const PAY_STATUS = { PAID: "paid", PENDING: "pending", OVERDUE: "pending" } as const;

export async function fetchAll() {
  const [students, sessions, payments, notes] = await prisma.$transaction([
    prisma.student.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.session.findMany({ include: { student: true }, orderBy: { date: "asc" } }),
    prisma.payment.findMany({ include: { student: true }, orderBy: { date: "desc" } }),
    prisma.note.findMany({ orderBy: { date: "desc" } }),
  ]);

  return {
    students: students.map(
      (s): Student => ({
        id: s.id,
        name: s.name,
        level: s.level ?? "—",
        term: s.term ?? "—",
        active: s.active,
        phone: s.phone ?? "",
        hasAccount: !!s.userId,
      })
    ),
    sessions: sessions.map(
      (s): Session => ({
        id: s.id,
        studentName: s.student.name,
        date: day(s.date),
        time: timeOf(s.date),
        topic: s.topic ?? "",
        status: SESSION_STATUS[s.status],
      })
    ),
    payments: payments.map(
      (p): Payment => ({
        id: p.id,
        studentName: p.student.name,
        amount: p.amount,
        date: day(p.date),
        status: PAY_STATUS[p.status],
      })
    ),
    notes: notes.map(
      (n): Note => ({
        id: n.id,
        studentId: n.studentId,
        title: n.title,
        content: n.content,
        date: day(n.date),
        attachments: (n.attachments as Attachment[]) ?? [],
      })
    ),
  };
}

const studentSchema = z.object({
  name: z.string().trim().min(1),
  phone: z.string().regex(/^09\d{9}$/),
  level: z.string().min(1),
  term: z.string().trim().min(1),
  active: z.boolean(),
});

export async function createStudent(input: z.input<typeof studentSchema>): Promise<Student> {
  const d = studentSchema.parse(input);
  const row = await prisma.student.create({
    data: { name: d.name, phone: d.phone, level: d.level, term: d.term, active: d.active },
  });
  return { id: row.id, name: row.name, level: row.level ?? "—", term: row.term ?? "—", active: row.active, phone: row.phone ?? "" };
}

const sessionSchema = z.object({
  studentName: z.string().min(1),
  topic: z.string().trim().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
});

export async function createSession(input: z.input<typeof sessionSchema>): Promise<Session> {
  const d = sessionSchema.parse(input);
  const student = await prisma.student.findFirst({ where: { name: d.studentName } });
  if (!student) throw new Error("STUDENT_NOT_FOUND");
  const row = await prisma.session.create({
    data: { studentId: student.id, date: new Date(`${d.date}T${d.time}:00.000Z`), topic: d.topic, status: "SCHEDULED" },
    include: { student: true },
  });
  return { id: row.id, studentName: row.student.name, date: d.date, time: d.time, topic: row.topic ?? "", status: "upcoming" };
}

const paymentSchema = z.object({
  studentName: z.string().min(1),
  amount: z.number().int().min(10000),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(["paid", "pending"]),
});

export async function createPayment(input: z.input<typeof paymentSchema>): Promise<Payment> {
  const d = paymentSchema.parse(input);
  const student = await prisma.student.findFirst({ where: { name: d.studentName } });
  if (!student) throw new Error("STUDENT_NOT_FOUND");
  const row = await prisma.payment.create({
    data: {
      studentId: student.id,
      amount: d.amount,
      date: new Date(`${d.date}T00:00:00.000Z`),
      status: d.status === "paid" ? "PAID" : "PENDING",
    },
    include: { student: true },
  });
  return { id: row.id, studentName: row.student.name, amount: row.amount, date: d.date, status: d.status };
}

const noteSchema = z.object({
  studentId: z.string().min(1),
  title: z.string().trim().min(1),
  content: z.string().trim().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  attachments: z.array(z.object({ id: z.string(), name: z.string(), kind: z.enum(["image", "file"]), url: z.string() })),
});

export async function createNote(input: z.input<typeof noteSchema>): Promise<Note> {
  const d = noteSchema.parse(input);
  const row = await prisma.note.create({
    data: {
      studentId: d.studentId,
      title: d.title,
      content: d.content,
      date: new Date(`${d.date}T00:00:00.000Z`),
      attachments: d.attachments as unknown as object[],
    },
  });
  return { id: row.id, studentId: row.studentId, title: row.title, content: row.content, date: d.date, attachments: d.attachments };
}