"use server";

import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    throw new Error("Forbidden: Admin access required");
  }
  return session;
}

export async function listTeachers() {
  await requireAdmin();
  const teachers = await prisma.user.findMany({
    where: { role: "TEACHER" },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      twoFactorEnabled: true,
      workspace: {
        select: {
          _count: {
            select: { students: true, sessions: true, payments: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return teachers.map((t) => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
    studentCount: t.workspace?._count.students ?? 0,
    sessionCount: t.workspace?._count.sessions ?? 0,
    paymentCount: t.workspace?._count.payments ?? 0,
  }));
}

export async function createTeacher(email: string, name: string): Promise<{ password: string } | { error: string }> {
  await requireAdmin();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "ایمیل قبلاً ثبت شده" };

  const password = randomBytes(8).toString("base64url");
  const hash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      name,
      password: hash,
      role: "TEACHER",
      mustChangePassword: true,
    },
  });

  // ساخت workspace اختصاصی
  await prisma.workspace.create({
    data: {
      name: name || "My Workspace",
      ownerId: user.id,
    },
  });

  return { password };
}

export async function resetTeacherPassword(teacherId: string): Promise<{ password: string } | { error: string }> {
  await requireAdmin();

  const teacher = await prisma.user.findUnique({ where: { id: teacherId } });
  if (!teacher || teacher.role !== "TEACHER") return { error: "معلم یافت نشد" };

  const password = randomBytes(8).toString("base64url");
  const hash = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: { id: teacherId },
    data: { password: hash, mustChangePassword: true, twoFactorEnabled: false, twoFactorSecret: null },
  });

  return { password };
}

export async function deleteTeacher(teacherId: string): Promise<{ ok: true } | { error: string }> {
  await requireAdmin();

  const teacher = await prisma.user.findUnique({ where: { id: teacherId } });
  if (!teacher || teacher.role !== "TEACHER") return { error: "معلم یافت نشد" };

  // Cascade: workspace و همه‌ی داده‌ها حذف می‌شن
  await prisma.user.delete({ where: { id: teacherId } });
  return { ok: true };
}