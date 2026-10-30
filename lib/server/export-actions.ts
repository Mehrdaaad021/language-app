"use server";

import { prisma } from "@/lib/prisma";
import { requireTeacherWorkspace } from "./workspace";

export async function exportStudentsCSV(): Promise<{ csv: string; filename: string }> {
  const { workspaceId } = await requireTeacherWorkspace();
  const students = await prisma.student.findMany({
    where: { workspaceId },
    orderBy: { name: "asc" },
  });

  const header = "Name,Phone,Email,Level,Term,Active\n";
  const rows = students
    .map((s) =>
      [
        `"${s.name}"`,
        s.phone ?? "",
        s.email ?? "",
        s.level ?? "",
        s.term ?? "",
        s.active ? "Yes" : "No",
      ].join(",")
    )
    .join("\n");

  return {
    csv: header + rows,
    filename: `students-${new Date().toISOString().split("T")[0]}.csv`,
  };
}

export async function exportPaymentsCSV(): Promise<{ csv: string; filename: string }> {
  const { workspaceId } = await requireTeacherWorkspace();
  const payments = await prisma.payment.findMany({
    where: { workspaceId },
    include: { student: true },
    orderBy: { date: "desc" },
  });

  const header = "Student,Amount,Date,Status\n";
  const rows = payments
    .map((p) =>
      [
        `"${p.student.name}"`,
        p.amount,
        p.date.toISOString().split("T")[0],
        p.status,
      ].join(",")
    )
    .join("\n");

  return {
    csv: header + rows,
    filename: `payments-${new Date().toISOString().split("T")[0]}.csv`,
  };
}

export async function exportSessionsCSV(): Promise<{ csv: string; filename: string }> {
  const { workspaceId } = await requireTeacherWorkspace();
  const sessions = await prisma.session.findMany({
    where: { workspaceId },
    include: { student: true },
    orderBy: { date: "desc" },
  });

  const header = "Student,Date,Time,Topic,Status\n";
  const rows = sessions
    .map((s) =>
      [
        `"${s.student.name}"`,
        s.date.toISOString().split("T")[0],
        s.date.toISOString().split("T")[1].slice(0, 5),
        `"${s.topic ?? ""}"`,
        s.status,
      ].join(",")
    )
    .join("\n");

  return {
    csv: header + rows,
    filename: `sessions-${new Date().toISOString().split("T")[0]}.csv`,
  };
}