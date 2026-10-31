import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import BackupCard from "@/components/backup/BackupCard";

export default async function BackupPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSession();
  if (!session || session.role !== "TEACHER") redirect(`/${locale}/login`);

  const fa = locale === "fa";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold md:text-3xl">
          {fa ? "بکاپ و بازیابی" : "Backup & Restore"}
        </h1>
        <p className="mt-1 text-sm text-[var(--c-ink-soft)]">
          {fa
            ? "داده‌های کلاس تو، فقط مال تو — هر وقت خواستی یه نسخه‌ی امن بگیر."
            : "Your class data belongs to you — take a safe snapshot anytime."}
        </p>
      </div>

      <BackupCard />

      <div className="rounded-2xl bg-[var(--c-surface-2)] p-4 text-xs leading-relaxed text-[var(--c-ink-soft)]">
        {fa ? (
          <>
            <p className="font-extrabold text-[var(--c-ink)]">📌 نکته‌ها:</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>فایل بکاپ شامل شاگردها، جلسات، پرداخت‌ها و یادداشت‌هاست.</li>
              <li>بازیابی، داده‌های فعلی رو <b>کامل جایگزین</b> می‌کنه.</li>
              <li>فایل رو در جای امن نگه داری کن (شامل اطلاعات شاگردهاست).</li>
            </ul>
          </>
        ) : (
          <>
            <p className="font-extrabold text-[var(--c-ink)]">📌 Notes:</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>Backup includes students, sessions, payments and notes.</li>
              <li>Restore <b>fully replaces</b> current data.</li>
              <li>Keep the file safe — it contains student information.</li>
            </ul>
          </>
        )}
      </div>
    </div>
  );
}