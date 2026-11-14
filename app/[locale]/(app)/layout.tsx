import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/layout/AppShell";

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSession();

  if (!session) redirect(`/${locale}/login`);
  if (session.role === "STUDENT") redirect(`/${locale}/student`);

  // ── ساخت آبجکت user برای AppShell ──
  const dbUser = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { name: true, email: true },
  });

  const user = {
    name: dbUser?.name || session.name || "کاربر",
    email: dbUser?.email || session.email || "",
  };

  // ── آیا مالک اصلی اپ هست؟ (برای landing-editor قدیمی) ──
  const isOwner = session.email === process.env.OWNER_EMAIL;

  return (
    <AppShell user={user} isOwner={isOwner} role="TEACHER">
      {children}
    </AppShell>
  );
}