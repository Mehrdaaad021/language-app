"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CalendarPlus, CalendarDays } from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { TextField } from "@/components/ui/Field";
import EmptyState from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { useAppData } from "@/lib/store";
import { createSession } from "@/lib/server/actions";

export default function SessionsClient({ title, subtitle }: { title: string; subtitle: string }) {
  const t = useTranslations("Pages");
  const tf = useTranslations("Forms");
  const toast = useToast();
  const { data, loading, refresh } = useAppData();

  const [open, setOpen] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [topic, setTopic] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("17:00");
  const [saving, setSaving] = useState(false);

  const sessions = data?.sessions ?? [];
  const students = data?.students ?? [];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) return toast(tf("errors.required"));
    if (!topic.trim()) return toast(tf("errors.required"));
    if (!date) return toast(tf("errors.required"));
    if (!/^\d{2}:\d{2}$/.test(time)) return toast(tf("errors.required"));

    setSaving(true);
    try {
      await createSession({ studentName: studentName.trim(), topic: topic.trim(), date, time });
      toast(tf("sessionAdded"));
      setOpen(false);
      setStudentName("");
      setTopic("");
      setDate("");
      setTime("17:00");
      await refresh();
    } catch {
      toast(tf("saveError"));
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold md:text-3xl">{title}</h1>
          <p className="mt-1 text-sm text-[var(--c-ink-soft)]">{subtitle}</p>
        </div>
        <Button icon={<CalendarPlus size={16} />} onClick={() => setOpen(true)}>
          {t("addSession")}
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-[var(--c-surface-2)]" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          fa={{
            title: "هنوز جلسه‌ای ثبت نشده",
            hint: "اولین جلسه رو ثبت کن تا برنامه‌ی هفته‌ات این‌جا دیده بشه.",
          }}
          en={{
            title: "No sessions yet",
            hint: "Schedule your first session to see your week planned out here.",
          }}
          actionLabel={t("addSession")}
          onAction={() => setOpen(true)}
        />
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <Card key={s.id} className="flex items-center justify-between">
              <div>
                <p className="font-extrabold">{s.studentName}</p>
                <p className="mt-1 text-xs text-[var(--c-ink-soft)]">{s.topic}</p>
                <p className="mt-1 text-xs text-[var(--c-ink-soft)]">
                  {s.date} — {s.time}
                </p>
              </div>
              <Badge tone={s.status === "upcoming" ? "info" : s.status === "completed" ? "success" : "warn"}>
                {t(s.status)}
              </Badge>
            </Card>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={tf("newSession")}>
        <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
          <div>
            <label className="mb-1 block text-xs font-extrabold">{tf("student")}</label>
            <select
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="input-field"
            >
              <option value="">{tf("chooseStudent")}</option>
              {students.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <TextField label={tf("topic")} placeholder={tf("topicPh")} value={topic} onChange={(e) => setTopic(e.target.value)} />
          <TextField label={tf("date")} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <TextField label={tf("time")} type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="flex-1">
              {tf("cancel")}
            </Button>
            <Button type="submit" className="flex-1">
              {saving ? tf("loading") : tf("submit")}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}