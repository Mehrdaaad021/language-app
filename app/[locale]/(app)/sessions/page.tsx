import ExportButtons from "@/components/export/ExportButtons";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import SessionsClient from "@/components/sessions/SessionsClient";

export default async function SessionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSession();
  if (!session || session.role !== "TEACHER") redirect(`/${locale}/login`);

  const t = await getTranslations({ locale, namespace: "Pages" });
  return <SessionsClient title={t("sessionsTitle")} subtitle={t("sessionsSubtitle")} />;
}