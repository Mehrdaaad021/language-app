"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import bcrypt from "bcryptjs";
/* ═══════════ ۱) داشبورد ادمین ═══════════ */
export async function getAdminDashboard() {
  await requireAdmin();

  const [
    totalUsers,
    totalWorkspaces,
    totalStudents,
    totalSessions,
    totalPayments,
    totalRevenue,
    openTickets,
    suspendedUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.workspace.count(),
    prisma.student.count(),
    prisma.session.count(),
    prisma.payment.count(),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "PAID" } }),
    prisma.supportTicket.count({ where: { status: "OPEN" } }),
    prisma.user.count({ where: { suspended: true } }),
  ]);

  return {
    totalUsers,
    totalTeachers: totalWorkspaces,
    totalStudents,
    totalWorkspaces,
    totalSessions,
    totalPayments,
    totalRevenue: totalRevenue._sum.amount ?? 0,
    openTickets,
    suspendedUsers,
  };
}

/* ═══════════ ۲) رشد ۳۰ روزه ═══════════ */
export async function getGrowthData() {
  await requireAdmin();

  const days: { date: string; users: number; students: number; payments: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const start = new Date();
    start.setDate(start.getDate() - i);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const [users, students, paymentAgg] = await Promise.all([
      prisma.user.count({ where: { createdAt: { gte: start, lt: end } } }),
      prisma.student.count({ where: { createdAt: { gte: start, lt: end } } }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { createdAt: { gte: start, lt: end }, status: "PAID" },
      }),
    ]);

    days.push({
      date: start.toISOString().split("T")[0],
      users,
      students,
      payments: paymentAgg._sum.amount ?? 0,
    });
  }

  return days;
}

/* ═══════════ ۳) لیست معلم‌ها ═══════════ */
export async function getAdminTeachers() {
  await requireAdmin();

  const workspaces = await prisma.workspace.findMany({
    include: {
      owner: true,
      _count: { select: { students: true, sessions: true, payments: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return workspaces.map((w) => ({
    id: w.id,
    name: w.name,
    ownerName: w.owner.name ?? "—",
    ownerEmail: w.owner.email,
    ownerId: w.owner.id,
    verified: w.verified,
    suspended: w.suspended,
    studentCount: w._count.students,
    sessionCount: w._count.sessions,
    paymentCount: w._count.payments,
    createdAt: w.createdAt.toISOString(),
  }));
}

/* ═══════════ ۴) لیست کاربران ═══════════ */
export async function getAdminUsers() {
  await requireAdmin();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { _count: { select: { workspaces: true, supportTickets: true } } },
  });

  return users.map((u) => ({
    id: u.id,
    name: u.name ?? "—",
    email: u.email,
    role: u.role,
    platformRole: u.platformRole,
    suspended: u.suspended,
    workspaceCount: u._count.workspaces,
    createdAt: u.createdAt.toISOString(),
  }));
}

/* ═══════════ ۵) Suspend/Unsuspend کاربر ═══════════ */
export async function setUserSuspended(userId: string, suspended: boolean): Promise<{ ok: boolean }> {
  await requireAdmin();
  await prisma.user.update({
    where: { id: userId },
    data: { suspended, suspendedAt: suspended ? new Date() : null },
  });
  return { ok: true };
}

/* ═══════════ ۶) Verify/Suspend workspace ═══════════ */
export async function setWorkspaceStatus(
  workspaceId: string,
  action: "verify" | "unverify" | "suspend" | "unsuspend"
): Promise<{ ok: boolean }> {
  await requireAdmin();

  const data: Record<string, unknown> = {};
  if (action === "verify") { data.verified = true; data.verifiedAt = new Date(); }
  if (action === "unverify") { data.verified = false; data.verifiedAt = null; }
  if (action === "suspend") { data.suspended = true; }
  if (action === "unsuspend") { data.suspended = false; }

  await prisma.workspace.update({ where: { id: workspaceId }, data });
  return { ok: true };
}

/* ═══════════ ۷) Support Tickets ═══════════ */
export async function getAdminTickets() {
  await requireAdmin();
  const tickets = await prisma.supportTicket.findMany({
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return tickets.map((t) => ({
    id: t.id,
    userName: t.user.name ?? "—",
    userEmail: t.user.email,
    subject: t.subject,
    message: t.message,
    status: t.status,
    reply: t.reply,
    createdAt: t.createdAt.toISOString(),
  }));
}

export async function replyTicket(ticketId: string, reply: string): Promise<{ ok: boolean }> {
  await requireAdmin();
  if (!reply.trim()) return { ok: false };
  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { reply: reply.trim(), status: "REPLIED", repliedAt: new Date() },
  });
  return { ok: true };
}

export async function closeTicket(ticketId: string): Promise<{ ok: boolean }> {
  await requireAdmin();
  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { status: "CLOSED" },
  });
  return { ok: true };
}

/* ═══════════ ۸) ارتقا به ادمین پلتفرم ═══════════ */
export async function promoteToAdmin(userId: string): Promise<{ ok: boolean }> {
  await requireAdmin();
  await prisma.user.update({
    where: { id: userId },
    data: { platformRole: "ADMIN" },
  });
  return { ok: true };
}

/* ═══════════ ۹) ثبت تیکت ═══════════ */
export async function createSupportTicket(subject: string, message: string): Promise<{ ok: boolean; error?: string }> {
  const { getSession } = await import("@/lib/auth");
  const session = await getSession();
  if (!session) return { ok: false, error: "NOT_AUTHED" };
  if (!subject.trim() || !message.trim()) return { ok: false, error: "EMPTY" };

  await prisma.supportTicket.create({
    data: {
      userId: session.sub,
      subject: subject.trim(),
      message: message.trim(),
    },
  });
  return { ok: true };
}
/* ═══════════ ۱۰) ساخت معلم جدید توسط ادمین ═══════════ */
export async function createTeacher(input: {
  name: string;
  email: string;
  password: string;
}): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();

  const email = input.email.trim().toLowerCase();
  if (!input.name.trim() || !email || input.password.length < 8) {
    return { ok: false, error: "INVALID" };
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return { ok: false, error: "EMAIL_EXISTS" };

  const hash = await bcrypt.hash(input.password, 10);
  const user = await prisma.user.create({
    data: {
      name: input.name.trim(),
      email,
      password: hash,
      role: "TEACHER",
      platformRole: "USER",
      mustChangePassword: true,
    },
  });

  await prisma.workspace.create({
    data: { name: `کلاس ${input.name.trim()}`, ownerId: user.id },
  });

  return { ok: true };
}
/* ── آیا کاربر فعلی ادمین پلتفرم هست؟ (برای کامپوننت‌های کلاینت) ── */
export async function amIAdmin(): Promise<boolean> {
  const { isAdmin } = await import("@/lib/admin");
  return isAdmin();
}