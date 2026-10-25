"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/session";

export type AuthResult =
  | { ok: true; role: "ADMIN" | "TEACHER" | "STUDENT"; requires2fa?: boolean }
  | { ok: false; error: string };

const emailSchema = z.string().trim().toLowerCase().email();

/* ── محدودیت نرخ ورود: پایدار در دیتابیس (serverless-safe) ── */
async function isRateLimited(email: string): Promise<boolean> {
  const since = new Date(Date.now() - 10 * 60 * 1000);
  const count = await prisma.loginAttempt.count({
    where: { email, createdAt: { gte: since } },
  });
  return count >= 5;
}

async function recordFailedAttempt(email: string): Promise<void> {
  await prisma.loginAttempt.create({ data: { email } });
  await prisma.loginAttempt.deleteMany({
    where: { createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
  });
}

async function startSession(
  userId: string,
  role: "ADMIN" | "TEACHER" | "STUDENT",
  name: string | null,
  email: string,
  mustChangePassword = false
) {
  const token = await createSessionToken({
    sub: userId,
    role,
    name,
    email,
    mustChangePassword,
  });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

const setupSchema = z.object({
  name: z.string().trim().min(2),
  email: emailSchema,
  password: z.string().min(8),
});

export async function setupTeacher(input: unknown): Promise<AuthResult> {
  const parsed = setupSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const teachers = await prisma.user.count({ where: { role: { in: ["TEACHER", "ADMIN"] } } });
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

const loginSchema = z.object({ email: emailSchema, password: z.string().min(1) });

export async function loginAction(input: unknown): Promise<AuthResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  if (await isRateLimited(parsed.data.email)) return { ok: false, error: "tooMany" };

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) {
    await recordFailedAttempt(parsed.data.email);
    return { ok: false, error: "invalidCredentials" };
  }

  const ok = await bcrypt.compare(parsed.data.password, user.password);
  if (!ok) {
    await recordFailedAttempt(parsed.data.email);
    return { ok: false, error: "invalidCredentials" };
  }

  await prisma.loginAttempt.deleteMany({ where: { email: parsed.data.email } });

  if (user.twoFactorEnabled) {
    const token = await createSessionToken({
      sub: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
      pending2fa: true,
      mustChangePassword: user.mustChangePassword,
    });
    const store = await cookies();
    store.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 10,
      path: "/",
    });
    return { ok: true, role: user.role, requires2fa: true };
  }

  await startSession(user.id, user.role, user.name, user.email, user.mustChangePassword);
  return { ok: true, role: user.role };
}

export async function logoutAction(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

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

export async function changePassword(
  oldPassword: string,
  newPassword: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "notAuthenticated" };

  if (newPassword.length < 8) return { ok: false, error: "passwordTooShort" };

  const user = await prisma.user.findUnique({ where: { id: session.sub } });
  if (!user) return { ok: false, error: "userNotFound" };

  const valid = await bcrypt.compare(oldPassword, user.password);
  if (!valid) return { ok: false, error: "wrongPassword" };

  const hash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: session.sub },
    data: { password: hash, mustChangePassword: false },
  });

  const token = await createSessionToken({
    sub: session.sub,
    role: session.role,
    name: session.name,
    email: session.email,
    mustChangePassword: false,
  });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });

  return { ok: true };
}