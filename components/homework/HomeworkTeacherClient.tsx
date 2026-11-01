"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Plus, BookOpen } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import { useAppData } from "@/lib/store";
import { getTeacherHomeworks, type HomeworkItem } from "@/lib/server/portal-actions";
import { NewHomeworkForm, HomeworkCard } from "@/components/homework/HomeworkList";

export default function HomeworkTeacherClient() {
  const locale = useLocale();
  const fa = locale === "fa";
  const { data } = useAppData();
  const [items, setItems] = useState<HomeworkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const students = data?.students ?? [];

  const load = async () => {
    setLoading(true);
    try {
      const rows = (await getTeacherHomeworks()) as unknown as HomeworkItem[];
      setItems(rows);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold md:text-3xl">
            {fa ? "تکلیف‌ها" : "Homework"}
          </h1>
          <p className="mt-1 text-sm text-[var(--c-ink-soft)]">
            {fa ? "تکلیف تعریف کن، تحویل بگیر و تصحیح کن." : "Assign, collect, and grade."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="btn-primary flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-extrabold shadow-lg"
        >
          <Plus size={16} />
          {fa ? "تکلیف جدید" : "New homework"}
        </button>
      </div>

      {showForm && students.length > 0 && (
        <NewHomeworkForm students={students} onDone={load} onClose={() => setShowForm(false)} />
      )}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-32 rounded-3xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          fa={{ title: "تکلیفی ثبت نشده", hint: "اولین تکلیف رو برای شاگردهات تعریف کن." }}
          en={{ title: "No homework yet", hint: "Create your first assignment." }}
          actionLabel={fa ? "ساخت تکلیف" : "New homework"}
          onAction={() => setShowForm(true)}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <HomeworkCard key={item.id} item={item} role="TEACHER" onRefresh={load} />
          ))}
        </div>
      )}
    </div>
  );
}