"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession, requireTeacherAction } from "@/lib/auth";
import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/session";
import type { Note, Payment, Session, Student } from "@/lib/types";

export type AuthResult =
  | { ok: true; role: "TEACHER" | "STUDENT"; requires2fa?: boolean }
  | { ok: false; error: string };

/* لایه‌ی ۴: محدودیت نرخ ورود (۵ تلاش در ۱۰ دقیقه) */
const attempts = new Map<string, number[]>();

const emailSchema = z.string().trim().toLowerCase().email();

async function startSession(userId: string, role: "TEACHER" | "STUDENT", name: string | null, email: string) {
  const token = await createSessionToken({ sub: userId, role, name, email });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

/* ── راه‌اندازی اولیه: ساخت اولین معلم ── */
const setupSchema = z.object({
  name: z.string().trim().min(2),
  email: emailSchema,
  password: z.string().min(8),
});

export async function setupTeacher(input: unknown): Promise<AuthResult> {
  const parsed = setupSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const teachers = await prisma.user.count({ where: { role: "TEACHER" } });
  if (teachers > 0) return { ok: false, error: "alreadySetup" };

  const dup = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (dup) return { ok: false, error: "emailTaken" };

  const hash = await bcrypt.hash(parsed.data.password, 10);
  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      password: hash,
      role: "TEACHER",
    },
  });

  await startSession(user.id, "TEACHER", user.name, user.email);
  return { ok: true, role: "TEACHER" };
}

/* ── ورود ── */
const loginSchema = z.object({ email: emailSchema, password: z.string().min(1) });

export async function loginAction(input: unknown): Promise<AuthResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const key = parsed.data.email;
  const now = Date.now();
  const recent = (attempts.get(key) ?? []).filter((t) => now - t < 10 * 60 * 1000);
  if (recent.length >= 5) return { ok: false, error: "tooMany" };

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) {
    attempts.set(key, [...recent, now]);
    return { ok: false, error: "invalidCredentials" };
  }

  const ok = await bcrypt.compare(parsed.data.password, user.password);
  if (!ok) {
    attempts.set(key, [...recent, now]);
    return { ok: false, error: "invalidCredentials" };
  }
  attempts.delete(key);

  // اگه 2FA فعاله، session موقت با pending بساز
  if (user.twoFactorEnabled) {
    const token = await createSessionToken({
      sub: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
      pending2fa: true,
    });
    const store = await cookies();
    store.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 10, // فقط ۱۰ دقیقه فرصت verify
      path: "/",
    });
    return { ok: true, role: user.role, requires2fa: true };
  }

  await startSession(user.id, user.role, user.name, user.email);
  return { ok: true, role: user.role };
}

/* ── خروج ── */
export async function logoutAction(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/* ── ساخت حساب ورود برای شاگرد (فقط معلم) ── */
const accountSchema = z.object({
  studentId: z.string().min(1),
  email: emailSchema,
  password: z.string().min(8),
});

export async function createStudentAccount(input: unknown): Promise<AuthResult> {
  const session = await getSession();
  if (!session || session.role !== "TEACHER") return { ok: false, error: "forbidden" };

  const parsed = accountSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const student = await prisma.student.findUnique({ where: { id: parsed.data.studentId } });
  if (!student) return { ok: false, error: "invalid" };
  if (student.userId) return { ok: false, error: "alreadyLinked" };

  const dup = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (dup) return { ok: false, error: "emailTaken" };

  const hash = await bcrypt.hash(parsed.data.password, 10);
  const user = await prisma.user.create({
    data: { email: parsed.data.email, password: hash, role: "STUDENT", name: student.name },
  });
  await prisma.student.update({ where: { id: student.id }, data: { userId: user.id } });

  return { ok: true, role: "STUDENT" };
}

/* ── شاگرد جدید ── */
const studentSchema = z.object({
  name: z.string().trim().min(1),
  phone: z.string().regex(/^09\d{9}$/),
  level: z.string().min(1),
  term: z.string().trim().min(1),
  active: z.boolean(),
});

export async function createStudent(input: z.input<typeof studentSchema>): Promise<Student> {
  await requireTeacherAction();
  const d = studentSchema.parse(input);
  const row = await prisma.student.create({
    data: { name: d.name, phone: d.phone, level: d.level, term: d.term, active: d.active },
  });
  return { id: row.id, name: row.name, level: row.level ?? "—", term: row.term ?? "—", active: row.active, phone: row.phone ?? "" };
}

/* ── جلسه جدید ── */
const sessionSchema = z.object({
  studentName: z.string().min(1),
  topic: z.string().trim().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
});

export async function createSession(input: z.input<typeof sessionSchema>): Promise<Session> {
  await requireTeacherAction();
  const d = sessionSchema.parse(input);
  const student = await prisma.student.findFirst({ where: { name: d.studentName } });
  if (!student) throw new Error("STUDENT_NOT_FOUND");
  const row = await prisma.session.create({
    data: { studentId: student.id, date: new Date(`${d.date}T${d.time}:00.000Z`), topic: d.topic, status: "SCHEDULED" },
    include: { student: true },
  });
  return { id: row.id, studentName: row.student.name, date: d.date, time: d.time, topic: row.topic ?? "", status: "upcoming" };
}

/* ── پرداخت جدید ── */
const paymentSchema = z.object({
  studentName: z.string().min(1),
  amount: z.number().int().min(10000),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(["paid", "pending"]),
});

export async function createPayment(input: z.input<typeof paymentSchema>): Promise<Payment> {
  await requireTeacherAction();
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

/* ── یادداشت جدید ── */
const noteSchema = z.object({
  studentId: z.string().min(1),
  title: z.string().trim().min(1),
  content: z.string().trim().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  attachments: z.array(
    z.object({ id: z.string(), name: z.string(), kind: z.enum(["image", "file"]), url: z.string() })
  ),
});

export async function createNote(input: z.input<typeof noteSchema>): Promise<Note> {
  await requireTeacherAction();
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