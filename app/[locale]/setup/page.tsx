import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SetupForm from "@/components/auth/SetupForm";

export default async function SetupPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSession();
  if (session) redirect(`/${locale}/`);

  const teachers = await prisma.user.count({ where: { role: "TEACHER" } });
  if (teachers > 0) redirect(`/${locale}/login`);

  return (
    <main className="relative flex min-h-screen items-center justify-center p-6">
      <div className="glass-bg">
        <div className="blob-3" />
      </div>
      <SetupForm />
    </main>
  );
}