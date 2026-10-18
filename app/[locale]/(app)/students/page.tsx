"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Plus, Phone, ChevronLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import { Stagger, StaggerItem } from "@/components/ui/Reveal";
import NewStudentModal from "@/components/modals/NewStudentModal";
import { useAppData } from "@/lib/store";
import { formatNumber } from "@/lib/format";

export default function StudentsPage() {
  const t = useTranslations("Pages");
  const locale = useLocale();
  const { students } = useAppData();
  const [open, setOpen] = useState(false);
    const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams.get("new") === "1") setOpen(true);
  }, [searchParams]);

  const formatPhone = (p: string) =>
    formatNumber(Number(p), locale).replace(/,/g, " ");

  return (
    <Stagger>
      <StaggerItem>
        <PageHeader
          title={t("studentsTitle")}
          subtitle={t("studentsSubtitle")}
          action={<Button icon={<Plus size={17} />} onClick={() => setOpen(true)}>{t("addStudent")}</Button>}
        />
      </StaggerItem>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {students.map((s) => (
          <StaggerItem key={s.id} className="h-full">
            <Link href={`/students/${s.id}`} className="block h-full">
              <Card hoverable className="group flex h-full flex-col">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFCED8] to-[#FFDDDD] text-lg font-extrabold text-[#8A4A56] shadow-inner">
                    {s.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{s.name}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-[var(--color-ink-soft)]">
                      <Phone size={12} />
                      {formatPhone(s.phone)}
                    </p>
                  </div>
                  <ChevronLeft
                    size={16}
                    className="icon-flip text-[var(--color-ink-soft)] opacity-0 transition-all group-hover:opacity-100"
                  />
                </div>

                <div className="mt-5 flex items-center justify-between">
                  <Badge tone="info">{s.level}</Badge>
                  <Badge tone={s.active ? "success" : "danger"}>
                    <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                    {s.active ? t("active") : t("inactive")}
                  </Badge>
                </div>

                <p className="mt-4 rounded-xl bg-white/25 px-3 py-2 text-xs text-[var(--color-ink-soft)]">
                  {t("term")}: {s.term}
                </p>
              </Card>
            </Link>
          </StaggerItem>
        ))}
      </div>

      <NewStudentModal open={open} onClose={() => setOpen(false)} />
    </Stagger>
  );
}