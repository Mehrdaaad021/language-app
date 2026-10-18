import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSiteConfig } from "@/lib/server/config-actions";
import Landing from "@/components/landing/Landing";

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSession();
  const teachers = await prisma.user.count({ where: { role: "TEACHER" } });
  const all = await getSiteConfig();
  const content = locale === "en" ? all.en : all.fa;

  return <Landing role={session?.role ?? null} firstRun={teachers === 0} content={content} />;
}