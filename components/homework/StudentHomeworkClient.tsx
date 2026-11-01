"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { BookOpen } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import { getMyPortalExtras, type HomeworkItem } from "@/lib/server/portal-actions";
import { HomeworkCard } from "@/components/homework/HomeworkList";

export default function StudentHomeworkClient() {
  const locale = useLocale();
  const fa = locale === "fa";
  const [items, setItems] = useState<HomeworkItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getMyPortalExtras();
      setItems(data.homeworks as unknown as HomeworkItem[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold md:text-3xl">{fa ? "تکلیف‌های من" : "My homework"}</h1>
        <p className="mt-1 text-sm text-[var(--c-ink-soft)]">
          {fa ? "تکلیف‌های داده‌شده + تحویل + نمره‌ها" : "Assignments, submissions, grades"}
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-32 rounded-3xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          fa={{ title: "تکلیفی نداری", hint: "وقتی معلم تکلیفی بده اینجا دیده می‌شه." }}
          en={{ title: "No homework", hint: "Assignments will appear here." }}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <HomeworkCard key={item.id} item={item} role="STUDENT" onRefresh={load} />
          ))}
        </div>
      )}
    </div>
  );
}