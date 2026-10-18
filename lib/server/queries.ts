import type { Attachment } from "@/lib/types";
import { prisma } from "@/lib/prisma";
import type { Note, Payment, Session, Student } from "@/lib/types";

const day = (d: Date) => d.toISOString().slice(0, 10);
const timeOf = (d: Date) => d.toISOString().slice(11, 16);

const SESSION_STATUS = { SCHEDULED: "upcoming", COMPLETED: "completed", CANCELLED: "cancelled" } as const;
const PAY_STATUS = { PAID: "paid", PENDING: "pending", OVERDUE: "pending" } as const;

export async function getStudentBundle(studentId: string) {
  const [student, sessions, payments, notes] = await Promise.all([
    prisma.student.findUnique({ where: { id: studentId } }),
    prisma.session.findMany({ where: { studentId }, include: { student: true }, orderBy: { date: "asc" } }),
    prisma.payment.findMany({ where: { studentId }, include: { student: true }, orderBy: { date: "desc" } }),
    prisma.note.findMany({ where: { studentId }, orderBy: { date: "desc" } }),
  ]);

  if (!student) return null;

  return {
    student: {
      id: student.id,
      name: student.name,
      level: student.level ?? "—",
      term: student.term ?? "—",
      active: student.active,
      phone: student.phone ?? "",
    } as Student,
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

export async function loadStudentArea(userId: string) {
  const student = await prisma.student.findUnique({ where: { userId } });
  if (!student) return null;
  return getStudentBundle(student.id);
}