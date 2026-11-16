import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export class AuthzError extends Error {
  code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

/* ── معلم: فقط workspace خودش ── */
export async function requireTeacherContext() {
  const session = await getSession();
  if (!session) throw new AuthzError("UNAUTHENTICATED");
  if (session.role === "STUDENT") throw new AuthzError("FORBIDDEN");

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { suspended: true },
  });
  if (!user || user.suspended) throw new AuthzError("SUSPENDED");

  const ws = await prisma.workspace.findFirst({
    where: { ownerId: session.sub },
    select: { id: true, suspended: true },
  });
  if (!ws || ws.suspended) throw new AuthzError("NO_WORKSPACE");

  return { userId: session.sub, workspaceId: ws.id, role: session.role };
}

/* ── شاگرد: فقط رکورد خودش ── */
export async function requireStudentContext() {
  const session = await getSession();
  if (!session || session.role !== "STUDENT") throw new AuthzError("FORBIDDEN");

  const student = await prisma.student.findFirst({
    where: { userId: session.sub },
    select: { id: true, workspaceId: true, active: true },
  });
  if (!student || !student.active) throw new AuthzError("NO_STUDENT");

  return { userId: session.sub, studentId: student.id, workspaceId: student.workspaceId };
}

/* ── تعلق یک شاگرد به workspace معلم ── */
export async function assertStudentInWorkspace(workspaceId: string, studentId: string) {
  const row = await prisma.student.findFirst({
    where: { id: studentId, workspaceId },
    select: { id: true },
  });
  if (!row) throw new AuthzError("FORBIDDEN");
  return row;
}

/* ── تعلق یک جلسه به workspace ── */
export async function assertSessionInWorkspace(workspaceId: string, sessionId: string) {
  const row = await prisma.session.findFirst({
    where: { id: sessionId, workspaceId },
    select: { id: true, studentId: true },
  });
  if (!row) throw new AuthzError("FORBIDDEN");
  return row;
}

/* ── IP کلاینت ── */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return h.get("x-real-ip") ?? "local";
}

/* ── محدودسازی نرخ (پنجره‌ی لغزان) ── */
export async function enforceRateLimit(key: string, limit: number, windowSeconds: number) {
  const now = Date.now();
  const row = await prisma.rateLimit.upsert({
    where: { key },
    create: { key, count: 1, resetAt: new Date(now + windowSeconds * 1000) },
    update: { count: { increment: 1 } },
  });
  if (row.resetAt.getTime() <= now) {
    await prisma.rateLimit.update({
      where: { key },
      data: { count: 1, resetAt: new Date(now + windowSeconds * 1000) },
    });
    return;
  }
  if (row.count > limit) throw new AuthzError("RATE_LIMITED");
}
/* ── فقط نشست معتبر (برای اکشن‌های نشست‌محور مثل 2FA) ── */
export async function requireSession() {
  const session = await getSession();
  if (!session) throw new AuthzError("UNAUTHENTICATED");
  return session;
}