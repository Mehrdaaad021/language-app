import ExportButtons from "@/components/export/ExportButtons";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import StudentsClient from "@/components/students/StudentsClient";

export default async function StudentsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSession();
  if (!session || session.role !== "TEACHER") redirect(`/${locale}/login`);

  const t = await getTranslations({ locale, namespace: "Pages" });
  return <StudentsClient title={t("studentsTitle")} subtitle={t("studentsSubtitle")} />;
}