"use server";

import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { requireTeacherAction, getSession } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/session";
import { cookies } from "next/headers";

export async function generateInviteLink(studentId: string): Promise<{ token: string } | { error: string }> {
  await requireTeacherAction();
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) return { error: "NOT_FOUND" };
  if (student.userId) return { error: "ALREADY_LINKED" };

  const token = randomBytes(16).toString("hex");
  await prisma.student.update({
    where: { id: studentId },
    data: { inviteToken: token, invitedAt: new Date() },
  });
  return { token };
}

export async function revokeInviteLink(studentId: string): Promise<{ ok: boolean }> {
  await requireTeacherAction();
  await prisma.student.update({
    where: { id: studentId },
    data: { inviteToken: null, invitedAt: null },
  });
  return { ok: true };
}

export async function getInviteInfo(token: string) {
  const student = await prisma.student.findUnique({ where: { inviteToken: token } });
  if (!student) return null;
  return {
    studentId: student.id,
    studentName: student.name,
    level: student.level ?? "—",
    term: student.term ?? "—",
    hasAccount: !!student.userId,
  };
}

const claimSchema = z.object({
  token: z.string().min(8),
  password: z.string().min(8),
});

export async function claimInvite(input: unknown): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = claimSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const session = await getSession();
  if (!session || session.role !== "STUDENT") return { ok: false, error: "forbidden" };

  const student = await prisma.student.findUnique({ where: { inviteToken: parsed.data.token } });
  if (!student) return { ok: false, error: "invalidToken" };
  if (student.userId && student.userId !== session.sub) return { ok: false, error: "alreadyClaimed" };

  const hash = await bcrypt.hash(parsed.data.password, 10);
  await prisma.user.update({ where: { id: session.sub }, data: { password: hash } });
  await prisma.student.update({
    where: { id: student.id },
    data: { userId: session.sub, inviteToken: null, invitedAt: null },
  });

  const token = await createSessionToken({
    sub: session.sub,
    role: "STUDENT",
    name: student.name,
    email: session.email,
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

export async function getStudentInviteToken(studentId: string): Promise<string | null> {
  await requireTeacherAction();
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { inviteToken: true },
  });
  return student?.inviteToken ?? null;
}