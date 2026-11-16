import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LoginForm from "@/components/auth/LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSession();
  if (session) {
    redirect(session.role === "STUDENT" ? `/${locale}/student` : `/${locale}/dashboard`);
  }

  let teachers = 1;
  let dbError = false;
  try {
    teachers = await prisma.user.count({ where: { role: "TEACHER" } });
  } catch {
    dbError = true;
  }

  if (!dbError && teachers === 0) redirect(`/${locale}/setup`);

  return <LoginForm dbError={dbError} />;
}