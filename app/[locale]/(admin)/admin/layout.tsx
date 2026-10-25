import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function AdminLayout({
  params,
  children,
}: {
  params: Promise<{ locale: string }>;
  children: ReactNode;
}) {
  const { locale } = await params;
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect(`/${locale}/login`);

  return <>{children}</>;
}