"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CalendarDays, Plus, X } from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { useAppData } from "@/lib/store";
import { createSession } from "@/lib/server/actions";
import ExportButtons from "@/components/export/ExportButtons";
import { toJalali, toFa } from "@/lib/jalali";
import { SkeletonCard } from "@/components/ui/Skeleton";
const inputCls =
  "w-full rounded-xl border border-white/40 bg-white/40 px-4 py-2.5 text-sm font-bold outline-none transition focus:border-[#D94F63]";

function SessionForm({ onClose, onDone }: { onClose: () => void; onDone: () => Promise<void> }) {
  const tf = useTranslations("Forms");
  const toast = useToast();
  const { data } = useAppData();
  const students = data?.students ?? [];

  const [studentName, setStudentName] = useState("");
  const [topic, setTopic] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName) return toast(tf("errors.required"));
    if (!topic.trim()) return toast(tf("errors.required"));
    if (!date) return toast(tf("errors.required"));
    if (!time) return toast(tf("errors.required"));

    setSaving(true);
    try {
      await createSession({ studentName, topic: topic.trim(), date, time });
      toast(tf("sessionAdded"));
      await onDone();
      onClose();
    } catch {
      toast(tf("saveError"));
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        className="glass-strong max-h-[90vh] w-full max-w-md overflow-y-auto rounded-[24px] p-6 shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-extrabold">{tf("newSession")}</h2>
          <button type="button" onClick={onClose} aria-label={tf("cancel")} className="rounded-lg p-1 transition hover:bg-white/30">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
          <div>
            <label className="mb-1 block text-xs font-extrabold">{tf("student")}</label>
            <select className={inputCls} value={studentName} onChange={(e) => setStudentName(e.target.value)}>
              <option value="">{tf("chooseStudent")}</option>
              {students.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-extrabold">{tf("topic")}</label>
            <input className={inputCls} value={topic} onChange={(e) => setTopic(e.target.value)} placeholder={tf("topicPh")} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-extrabold">{tf("date")}</label>
              <input className={inputCls} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-extrabold">{tf("time")}</label>
              <input className={inputCls} type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>

          <div className="mt-1 flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-full bg-white/30 py-2.5 text-sm font-extrabold transition hover:bg-white/40">
              {tf("cancel")}
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 rounded-full py-2.5 text-sm font-extrabold shadow-lg transition disabled:opacity-60">
              {saving ? tf("loading") : tf("submit")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SessionsClient({ title, subtitle }: { title: string; subtitle: string }) {
  const t = useTranslations("Pages");
  const locale = useLocale();
  const fa = locale === "fa";
  const { data, loading, refresh } = useAppData();
  const [open, setOpen] = useState(false);

  const sessions = data?.sessions ?? [];
  const upcoming = sessions.filter((s) => s.status === "upcoming");
  const past = sessions.filter((s) => s.status !== "upcoming");

  const dateLabel = (d: string) => {
    if (!fa) return d;
    const [y, m, dd] = d.split("-").map(Number);
    const [jy, jm, jd] = toJalali(y, m, dd);
    return `${toFa(jy)}/${toFa(String(jm).padStart(2, "0"))}/${toFa(String(jd).padStart(2, "0"))}`;
  };

  const statusBadge = (status: string) =>
    status === "upcoming" ? (
      <Badge tone="info">{t("upcoming")}</Badge>
    ) : status === "completed" ? (
      <Badge tone="success">{t("completed")}</Badge>
    ) : (
      <Badge tone="warn">{t("cancelled")}</Badge>
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold md:text-3xl">{title}</h1>
          <p className="mt-1 text-sm text-[var(--c-ink-soft)]">{subtitle}</p>
        </div>
        <div className="flex gap-2">
          <ExportButtons type="sessions" />
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="btn-primary flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-extrabold shadow-lg transition"
          >
            <Plus size={16} />
            {t("addSession")}
          </button>
        </div>
      </div>

            {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          fa={{
            title: "هنوز جلسه‌ای ثبت نشده",
            hint: "اولین جلسه‌ی کلاست رو زمان‌بندی کن تا این‌جا دیده بشه.",
          }}
          en={{
            title: "No sessions yet",
            hint: "Schedule your first class session to see it here.",
          }}
          actionLabel={t("addSession")}
          onAction={() => setOpen(true)}
        />
      ) : (
        <div className="space-y-8">
          {upcoming.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-extrabold text-[var(--c-ink-soft)]">{t("upcoming")}</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {upcoming.map((s) => (
                  <Card key={s.id} hoverable>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-extrabold">{s.studentName}</p>
                        <p className="mt-1 text-xs text-[var(--c-ink-soft)]">{s.topic || "—"}</p>
                      </div>
                      {statusBadge(s.status)}
                    </div>
                    <p className="mt-3 text-xs font-bold text-[var(--c-ink-soft)]">
                      {dateLabel(s.date)} — {fa ? toFa(s.time) : s.time}
                    </p>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {past.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-extrabold text-[var(--c-ink-soft)]">
                {t("completed")} / {t("cancelled")}
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {past.map((s) => (
                  <Card key={s.id}>
                    <div className="flex items-start justify-between opacity-80">
                      <div>
                        <p className="font-extrabold">{s.studentName}</p>
                        <p className="mt-1 text-xs text-[var(--c-ink-soft)]">{s.topic || "—"}</p>
                      </div>
                      {statusBadge(s.status)}
                    </div>
                    <p className="mt-3 text-xs font-bold text-[var(--c-ink-soft)]">
                      {dateLabel(s.date)} — {fa ? toFa(s.time) : s.time}
                    </p>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {open && <SessionForm onClose={() => setOpen(false)} onDone={refresh} />}
    </div>
  );
}