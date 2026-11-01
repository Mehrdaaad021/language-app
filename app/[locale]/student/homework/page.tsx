import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import StudentHomeworkClient from "@/components/homework/StudentHomeworkClient";

export default async function StudentHomeworkPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSession();
  if (!session || session.role !== "STUDENT") redirect(`/${locale}/student`);
  return <StudentHomeworkClient />;
}