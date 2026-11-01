import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import StudentMessagesClient from "@/components/messages/StudentMessagesClient";

export default async function StudentMessagesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSession();
  if (!session || session.role !== "STUDENT") redirect(`/${locale}/login`);

  const student = await prisma.student.findFirst({
    where: { userId: session.sub },
    include: { workspace: { include: { owner: true } } },
  });
  if (!student) redirect(`/${locale}/login`);

  const teacherName = student.workspace?.owner?.name ?? "Teacher";

  return <StudentMessagesClient studentId={student.id} teacherName={teacherName} />;
}