import { notFound, redirect } from "next/navigation";
import { getInviteInfo } from "@/lib/server/invite-actions";
import { prisma } from "@/lib/prisma";
import InviteSignupForm from "@/components/auth/InviteSignupForm";
import { getSession } from "@/lib/auth";

export default async function InviteSignupPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  const info = await getInviteInfo(token);
  if (!info) notFound();
  if (info.hasAccount) redirect(`/${locale}/login`);

  const session = await getSession();
  if (session) redirect(`/${locale}/invite/${token}`);

  const teachers = await prisma.user.count({ where: { role: "TEACHER" } });

  return <InviteSignupForm info={info} token={token} locale={locale} firstRun={teachers === 0} />;
}