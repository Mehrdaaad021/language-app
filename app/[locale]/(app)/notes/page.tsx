"use client";

import { useLocale, useTranslations } from "next-intl";
import { NotebookPen, ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import { Stagger, StaggerItem } from "@/components/ui/Reveal";
import { useAppData } from "@/lib/store";
import { formatDate } from "@/lib/format";

export default function NotesPage() {
  const t = useTranslations("Pages");
  const tp = useTranslations("Profile");
  const locale = useLocale();
  const { notes, students } = useAppData();

  const nameOf = (id: string) => students.find((s) => s.id === id)?.name ?? "—";

  return (
    <Stagger>
      <StaggerItem>
        <PageHeader title={t("notesTitle")} subtitle={t("notesSubtitle")} />
      </StaggerItem>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {notes.map((n) => (
          <StaggerItem key={n.id} className="h-full">
            <Link href={`/students/${n.studentId}`} className="block h-full">
              <Card hoverable className="flex h-full flex-col">
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(217,79,99,0.12)] text-[#B23A4C]">
                    <NotebookPen size={18} />
                  </span>
                  <span className="text-[11px] font-medium text-[var(--color-ink-soft)]">{formatDate(n.date, locale)}</span>
                </div>
                <h3 className="mt-4 font-extrabold leading-6">{n.title}</h3>
                <p className="mt-1 text-xs text-[var(--color-ink-soft)]">{nameOf(n.studentId)}</p>
                <p className="mt-3 flex-1 text-sm leading-7 text-[var(--color-ink-soft)]">
                  {n.content.slice(0, 90)}…
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 self-start text-xs font-bold text-[var(--color-primary)]">
                  {tp("openProfile")}
                  <ArrowLeft size={14} className="icon-flip" />
                </span>
              </Card>
            </Link>
          </StaggerItem>
        ))}
      </div>
    </Stagger>
  );
}