import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth";
import { loadStudentArea } from "@/lib/server/queries";
import StudentShell from "@/components/layout/StudentShell";

export default async function StudentLayout({
  params,
  children,
}: {
  params: Promise<{ locale: string }>;
  children: ReactNode;
}) {
  const { locale } = await params;
  const session = await getSession();
  if (!session || session.role !== "STUDENT") redirect(`/${locale}/login`);

  const bundle = await loadStudentArea(session.sub);

  if (!bundle) {
    const t = await getTranslations({ locale, namespace: "Student" });
    return (
      <main className="relative flex min-h-screen items-center justify-center p-6">
        <div className="glass-bg">
          <div className="blob-3" />
        </div>
        <div className="glass-strong max-w-md rounded-[28px] p-8 text-center">
          <p className="font-extrabold">{t("unlinked")}</p>
          <p className="mt-2 text-sm leading-7 text-[var(--color-ink-soft)]">{t("unlinkedHint")}</p>
        </div>
      </main>
    );
  }

  return <StudentShell studentName={bundle.student.name}>{children}</StudentShell>;
}