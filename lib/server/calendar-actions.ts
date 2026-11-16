"use server";

import { prisma } from "@/lib/prisma";
import { requireTeacherWorkspace } from "./workspace";

export type CalendarSessionRow = {
  id: string;
  studentId: string;
  studentName: string;
  date: string;
  topic: string;
  status: string;
  score: number | null;
  confirmed: boolean;
};

export type CalendarDraft = {
  studentId: string;
  date: string;
  time: string;
  topic: string;
  status: string;
  score: string;
};

const combine = (date: string, time: string) =>
  new Date(`${date}T${(time || "09:00").slice(0, 5)}:00`);

const mapRow = (r: {
  id: string;
  studentId: string;
  date: Date;
  topic: string | null;
  status: string;
  score: number | null;
  studentConfirmed: boolean;
  student: { name: string };
}): CalendarSessionRow => ({
  id: r.id,
  studentId: r.studentId,
  studentName: r.student.name,
  date: r.date.toISOString(),
  topic: r.topic ?? "",
  status: r.status,
  score: r.score,
  confirmed: r.studentConfirmed,
});

const INCLUDE = { student: { select: { name: true } } } as const;

export async function getCalendarData(): Promise<{
  sessions: CalendarSessionRow[];
  students: { id: string; name: string }[];
}> {
  const { workspaceId } = await requireTeacherWorkspace();
  const [sessions, students] = await Promise.all([
    prisma.session.findMany({
      where: { workspaceId },
      include: INCLUDE,
      orderBy: { date: "asc" },
      take: 1000,
    }),
    prisma.student.findMany({
      where: { workspaceId, active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);
  return { sessions: sessions.map(mapRow), students };
}

export async function createCalendarSession(
  input: CalendarDraft
): Promise<{ ok: boolean; row?: CalendarSessionRow; error?: string }> {
  const { workspaceId } = await requireTeacherWorkspace();
  const student = await prisma.student.findFirst({
    where: { id: input.studentId, workspaceId },
    select: { id: true },
  });
  if (!student) return { ok: false, error: "STUDENT" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) return { ok: false, error: "DATE" };

  const row = await prisma.session.create({
    data: {
      workspaceId,
      studentId: input.studentId,
      date: combine(input.date, input.time),
      topic: input.topic.trim() || null,
      status: input.status || "SCHEDULED",
      score: input.score.trim() === "" ? null : Math.max(0, Math.min(20, Number(input.score) || 0)),
    },
    include: INCLUDE,
  });
  return { ok: true, row: mapRow(row) };
}

export async function updateCalendarSession(
  id: string,
  patch: Partial<CalendarDraft>
): Promise<{ ok: boolean; row?: CalendarSessionRow }> {
  const { workspaceId } = await requireTeacherWorkspace();
  const existing = await prisma.session.findFirst({
    where: { id, workspaceId },
    include: INCLUDE,
  });
  if (!existing) return { ok: false };

  const dateStr = patch.date ?? isoLocal(existing.date);
  const timeStr = patch.time ?? timeLocal(existing.date);
  const studentId = patch.studentId ?? existing.studentId;
  if (patch.studentId) {
    const st = await prisma.student.findFirst({ where: { id: studentId, workspaceId }, select: { id: true } });
    if (!st) return { ok: false };
  }

  const row = await prisma.session.update({
    where: { id },
    data: {
      studentId,
      date: combine(dateStr, timeStr),
      topic: patch.topic !== undefined ? patch.topic.trim() || null : existing.topic,
      status: patch.status ?? existing.status,
      score:
        patch.score !== undefined
          ? patch.score.trim() === ""
            ? null
            : Math.max(0, Math.min(20, Number(patch.score) || 0))
          : existing.score,
    },
    include: INCLUDE,
  });
  return { ok: true, row: mapRow(row) };
}

export async function deleteCalendarSession(id: string): Promise<{ ok: boolean }> {
  const { workspaceId } = await requireTeacherWorkspace();
  await prisma.session.deleteMany({ where: { id, workspaceId } });
  return { ok: true };
}

function isoLocal(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function timeLocal(d: Date) {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}