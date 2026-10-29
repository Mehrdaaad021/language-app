"use server";

import { prisma } from "@/lib/prisma";
import { requireTeacherWorkspace } from "./workspace";

export async function createDemoData(): Promise<{ ok: boolean; error?: string }> {
  const { workspaceId } = await requireTeacherWorkspace();

  const existing = await prisma.student.count({ where: { workspaceId } });
  if (existing > 0) return { ok: false, error: "HAS_DATA" };

  const now = new Date();
  const day = (offset: number, hour = 17) => {
    const d = new Date(now.getTime() + offset * 86400000);
    d.setUTCHours(hour, 0, 0, 0);
    return d;
  };

  const [s1, s2, s3] = await Promise.all([
    prisma.student.create({
      data: {
        workspaceId,
        name: "سارا محمدی",
        phone: "09121234567",
        level: "B1",
        term: "ترم دوم",
        active: true,
      },
    }),
    prisma.student.create({
      data: {
        workspaceId,
        name: "Ali Rezaei",
        phone: "09129876543",
        level: "A2",
        term: "ترم اول",
        active: true,
      },
    }),
    prisma.student.create({
      data: {
        workspaceId,
        name: "مریم کریمی",
        phone: "09125554433",
        level: "C1",
        term: "ترم سوم",
        active: false,
      },
    }),
  ]);

  await Promise.all([
    prisma.session.create({
      data: {
        workspaceId,
        studentId: s1.id,
        date: day(-3),
        topic: "Grammar: Present Perfect",
        status: "COMPLETED",
      },
    }),
    prisma.session.create({
      data: {
        workspaceId,
        studentId: s2.id,
        date: day(1),
        topic: "Speaking: Travel",
        status: "SCHEDULED",
      },
    }),
    prisma.session.create({
      data: {
        workspaceId,
        studentId: s3.id,
        date: day(4),
        topic: "IELTS Writing Task 2",
        status: "SCHEDULED",
      },
    }),
    prisma.payment.create({
      data: {
        workspaceId,
        studentId: s1.id,
        amount: 4500000,
        date: day(-5),
        status: "PAID",
      },
    }),
    prisma.payment.create({
      data: {
        workspaceId,
        studentId: s2.id,
        amount: 3800000,
        date: day(-1),
        status: "PENDING",
      },
    }),
    prisma.note.create({
      data: {
        workspaceId,
        studentId: s1.id,
        title: "خلاصه‌ی جلسه‌ی ۴",
        content: "تمرین Present Perfect با ۱۰ جمله‌ی مثال. تکلیف: workbook صفحه‌ی ۲۲.",
        date: day(-3),
        attachments: [],
      },
    }),
  ]);

  return { ok: true };
}