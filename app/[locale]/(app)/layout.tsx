import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { getSession } from "@/lib/auth";

export default async function AppLayout({
  params,
  children,
}: {
  params: Promise<{ locale: string }>;
  children: ReactNode;
}) {
  const { locale } = await params;
  const session = await getSession();
  if (!session || session.role !== "TEACHER") redirect(`/${locale}/login`);

  return (
    <AppShell user={{ name: session.name ?? session.email, email: session.email }}>
      {children}
    </AppShell>
  );
}