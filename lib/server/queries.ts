import { prisma } from "@/lib/prisma";
import { getTeacherWorkspace } from "./workspace";
import { signAttachments } from "./upload-actions";

export async function getStudentBundle(studentId: string) {
  // رفع IDOR: فقط معلمِ صاحب workspace می‌تونه ببینه
  const ctx = await getTeacherWorkspace();
  if (!ctx) return null;

  const student = await prisma.student.findFirst({
    where: { id: studentId, workspaceId: ctx.workspaceId },
    include: {
      sessions: { orderBy: { date: "desc" } },
      payments: { orderBy: { date: "desc" } },
      notes: { orderBy: { date: "desc" } },
    },
  });
  if (!student) return null;

  return {
    student: {
      id: student.id,
      name: student.name,
      level: student.level ?? "—",
      term: student.term ?? "—",
      phone: student.phone ?? "",
    },
    sessions: student.sessions.map((s) => ({
      id: s.id,
      date: s.date.toISOString().split("T")[0],
      time: s.date.toISOString().split("T")[1].slice(0, 5),
      topic: s.topic ?? "",
      status: (s.status === "SCHEDULED" ? "upcoming" : s.status === "COMPLETED" ? "completed" : "cancelled") as
        | "upcoming"
        | "completed"
        | "cancelled",
    })),
    payments: student.payments.map((p) => ({
      id: p.id,
      amount: p.amount,
      date: p.date.toISOString().split("T")[0],
      status: (p.status === "PAID" ? "paid" : "pending") as "paid" | "pending",
    })),
    notes: await Promise.all(
      student.notes.map(async (n) => ({
        id: n.id,
        studentId: n.studentId,
        title: n.title,
        content: n.content,
        date: n.date.toISOString().split("T")[0],
        attachments: await signAttachments(n.attachments),
      }))
    ),
  };
}

export async function loadStudentArea(userId: string) {
  const student = await prisma.student.findUnique({
    where: { userId },
    include: {
      sessions: { orderBy: { date: "desc" } },
      payments: { orderBy: { date: "desc" } },
      notes: { orderBy: { date: "desc" } },
    },
  });
  if (!student) return null;

  return {
    student: {
      id: student.id,
      name: student.name,
      level: student.level ?? "—",
      term: student.term ?? "—",
    },
    sessions: student.sessions.map((s) => ({
      id: s.id,
      date: s.date.toISOString().split("T")[0],
      time: s.date.toISOString().split("T")[1].slice(0, 5),
      topic: s.topic ?? "",
      status: (s.status === "SCHEDULED" ? "upcoming" : s.status === "COMPLETED" ? "completed" : "cancelled") as
        | "upcoming"
        | "completed"
        | "cancelled",
    })),
    payments: student.payments.map((p) => ({
      id: p.id,
      amount: p.amount,
      date: p.date.toISOString().split("T")[0],
      status: (p.status === "PAID" ? "paid" : "pending") as "paid" | "pending",
    })),
    notes: await Promise.all(
      student.notes.map(async (n) => ({
        id: n.id,
        studentId: n.studentId,
        title: n.title,
        content: n.content,
        date: n.date.toISOString().split("T")[0],
        attachments: await signAttachments(n.attachments),
      }))
    ),
  };
}