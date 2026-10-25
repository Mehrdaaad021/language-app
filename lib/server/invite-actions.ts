"use server";

import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { requireTeacherWorkspace } from "./workspace";
import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/session";

/* لینک دعوت: ۷ روز اعتبار */
const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type InviteInfo = {
  studentId: string;
  studentName: string;
  level: string;
  term: string;
  hasAccount: boolean;
};

export async function generateInviteLink(studentId: string): Promise<{ token: string } | { error: string }> {
  const ctx = await requireTeacherWorkspace();

  // فقط شاگردِ همین workspace
  const student = await prisma.student.findFirst({
    where: { id: studentId, workspaceId: ctx.workspaceId },
  });
  if (!student) return { error: "NOT_FOUND" };
  if (student.userId) return { error: "ALREADY_LINKED" };

  const token = randomBytes(16).toString("hex");
  await prisma.student.update({
    where: { id: studentId },
    data: {
      inviteToken: token,
      invitedAt: new Date(),
      inviteExpiresAt: new Date(Date.now() + INVITE_TTL_MS),
    },
  });
  return { token };
}

export async function revokeInviteLink(studentId: string): Promise<{ ok: boolean }> {
  const ctx = await requireTeacherWorkspace();

  const student = await prisma.student.findFirst({
    where: { id: studentId, workspaceId: ctx.workspaceId },
    select: { id: true },
  });
  if (!student) return { ok: false };

  await prisma.student.update({
    where: { id: student.id },
    data: { inviteToken: null, invitedAt: null, inviteExpiresAt: null },
  });
  return { ok: true };
}

export async function getInviteInfo(token: string): Promise<InviteInfo | null> {
  const student = await prisma.student.findUnique({ where: { inviteToken: token } });
  if (!student) return null;

  // لینک منقضی‌شده = نامعتبر
  if (student.inviteExpiresAt && student.inviteExpiresAt < new Date()) return null;

  return {
    studentId: student.id,
    studentName: student.name,
    level: student.level ?? "—",
    term: student.term ?? "—",
    hasAccount: !!student.userId,
  };
}

export async function getStudentInviteToken(studentId: string): Promise<string | null> {
  const ctx = await requireTeacherWorkspace();

  const student = await prisma.student.findFirst({
    where: { id: studentId, workspaceId: ctx.workspaceId },
    select: { inviteToken: true, inviteExpiresAt: true },
  });
  if (!student) return null;

  // توکن منقضی‌شده رو برگردون نکن
  if (student.inviteExpiresAt && student.inviteExpiresAt < new Date()) return null;

  return student.inviteToken ?? null;
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

  // انقضای لینک
  if (student.inviteExpiresAt && student.inviteExpiresAt < new Date()) {
    return { ok: false, error: "expired" };
  }

  if (student.userId && student.userId !== session.sub) return { ok: false, error: "alreadyClaimed" };

  const hash = await bcrypt.hash(parsed.data.password, 10);
  await prisma.user.update({ where: { id: session.sub }, data: { password: hash } });
  await prisma.student.update({
    where: { id: student.id },
    data: { userId: session.sub, inviteToken: null, invitedAt: null, inviteExpiresAt: null },
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