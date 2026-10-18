"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Plus, CalendarDays } from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import { Stagger, StaggerItem } from "@/components/ui/Reveal";
import NewSessionModal from "@/components/modals/NewSessionModal";
import { useAppData } from "@/lib/store";
import { formatDate, formatWeekday, formatTime } from "@/lib/format";

const TONE = { upcoming: "info", completed: "success", cancelled: "danger" } as const;

export default function SessionsPage() {
  const t = useTranslations("Pages");
  const locale = useLocale();
  const { sessions } = useAppData();
  const [open, setOpen] = useState(false);
    const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams.get("new") === "1") setOpen(true);
  }, [searchParams]);

  const label = {
    upcoming: t("upcoming"),
    completed: t("completed"),
    cancelled: t("cancelled"),
  } as const;

  return (
    <Stagger>
      <StaggerItem>
        <PageHeader
          title={t("sessionsTitle")}
          subtitle={t("sessionsSubtitle")}
          action={<Button icon={<Plus size={17} />} onClick={() => setOpen(true)}>{t("addSession")}</Button>}
        />
      </StaggerItem>

      <StaggerItem>
        <Card>
          <Stagger className="flex flex-col gap-3">
            {sessions.map((se) => (
              <StaggerItem key={se.id}>
                <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-white/25 px-4 py-4 transition-colors duration-300 hover:bg-white/40">
                  <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFE8C4] to-[#FFF4DE] shadow-inner">
                    <span className="text-[10px] font-bold text-[var(--color-ink-soft)]">{formatWeekday(se.date, locale)}</span>
                    <span className="text-sm font-extrabold">{formatTime(se.time, locale)}</span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{se.studentName}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-[var(--color-ink-soft)]">
                      <CalendarDays size={13} />
                      <span>{formatDate(se.date, locale)}</span>
                      <span className="opacity-40">•</span>
                      <span className="truncate">{se.topic}</span>
                    </p>
                  </div>

                  <Badge tone={TONE[se.status]}>
                    <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                    {label[se.status]}
                  </Badge>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </Card>
      </StaggerItem>

      <NewSessionModal open={open} onClose={() => setOpen(false)} />
    </Stagger>
  );
}