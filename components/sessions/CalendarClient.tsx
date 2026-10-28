"use client";

import { useTranslations } from "next-intl";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

type Session = {
  id: string;
  studentName: string;
  date: string;
  time: string;
  topic: string;
  status: "upcoming" | "completed" | "cancelled";
};

export default function CalendarClient({ sessions }: { sessions: Session[] }) {
  const t = useTranslations("Pages");

  // گروه‌بندی بر اساس تاریخ (فقط ۷ روز آینده)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcoming = sessions
    .filter((s) => {
      const d = new Date(s.date);
      return d >= today && s.status === "upcoming";
    })
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 7);

  return (
    <Card>
      <h3 className="mb-3 text-base font-extrabold">{t("upcomingSessions")}</h3>
      {upcoming.length === 0 ? (
        <p className="py-6 text-center text-xs text-[var(--c-ink-soft)]">
          {t("noUpcoming")}
        </p>
      ) : (
        <div className="space-y-2">
          {upcoming.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between rounded-xl bg-[var(--c-surface-2)] p-3"
            >
              <div>
                <p className="text-sm font-extrabold">{s.studentName}</p>
                <p className="text-xs text-[var(--c-ink-soft)]">
                  {s.date} — {s.time} • {s.topic}
                </p>
              </div>
              <Badge tone="info">{t(s.status)}</Badge>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}