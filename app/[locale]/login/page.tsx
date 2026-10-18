import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LoginForm from "@/components/auth/LoginForm";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSession();
  if (session) redirect(session.role === "TEACHER" ? `/${locale}/` : `/${locale}/student`);

  const teachers = await prisma.user.count({ where: { role: "TEACHER" } });

  return (
    <main className="relative flex min-h-screen items-center justify-center p-6">
      <div className="glass-bg">
        <div className="blob-3" />
      </div>
      <LoginForm showSetup={teachers === 0} />
    </main>
  );
}