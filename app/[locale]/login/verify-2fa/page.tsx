import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import TwoFactorVerifyForm from "@/components/auth/TwoFactorVerifyForm";

export default async function Verify2faPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSession();

  if (!session) redirect(`/${locale}/login`);
  if (!session.pending2fa) {
    redirect(session.role === "TEACHER" ? `/${locale}/dashboard` : `/${locale}/student`);
  }

  return <TwoFactorVerifyForm />;
}