import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getInviteInfo } from "@/lib/server/invite-actions";
import InviteClaimForm from "@/components/auth/InviteClaimForm";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  const info = await getInviteInfo(token);
  if (!info) notFound();

  const session = await getSession();

  // اگه شاگرد قبلاً حساب داشته و لاگین نیست → ببرش به لاگین
  if (info.hasAccount && !session) redirect(`/${locale}/login?next=/invite/${token}`);

  // اگه شاگرد قبلاً ادعا شده توسط همین کاربر → ببرش به پنل
  if (info.hasAccount && session && session.role === "STUDENT") redirect(`/${locale}/student`);

  // اگه حساب نداره ولی کاربر لاگین نیست → ببرش به ثبت‌نام ساده
  if (!info.hasAccount && !session) {
    redirect(`/${locale}/invite/${token}/signup`);
  }

  return <InviteClaimForm info={info} token={token} locale={locale} />;
}