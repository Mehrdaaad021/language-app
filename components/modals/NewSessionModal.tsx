"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { z } from "zod";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { TextField, SelectField } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { useAppData } from "@/lib/store";
import { mapZodErrors } from "@/lib/format";

export default function NewSessionModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations("Forms");
  const toast = useToast();
  const { students, addSession } = useAppData();

  const [studentName, setStudentName] = useState("");
  const [topic, setTopic] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const schema = z.object({
    studentName: z.string().min(1, "required"),
    topic: z.string().trim().min(1, "required"),
    date: z.string().min(1, "required"),
    time: z.string().min(1, "required"),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = schema.safeParse({ studentName, topic, date, time });
    if (!res.success) {
      setErrors(mapZodErrors(res.error.issues));
      return;
    }
    addSession({ studentName, topic: res.data.topic, date, time, status: "upcoming" });
    toast(t("sessionAdded"));
    setStudentName(""); setTopic(""); setDate(""); setTime(""); setErrors({});
    onClose();
  };

  const err = (k: string) => (errors[k] ? t(`errors.${errors[k]}`) : undefined);

  return (
    <Modal open={open} onClose={onClose} title={t("newSession")}>
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <SelectField label={t("student")} value={studentName} error={err("studentName")} onChange={(e) => setStudentName(e.target.value)}>
          <option value="">{t("chooseStudent")}</option>
          {students.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
        </SelectField>
        <TextField label={t("topic")} placeholder={t("topicPh")} value={topic} error={err("topic")} onChange={(e) => setTopic(e.target.value)} />
        <div className="grid grid-cols-2 gap-4">
          <TextField label={t("date")} type="date" value={date} error={err("date")} onChange={(e) => setDate(e.target.value)} />
          <TextField label={t("time")} type="time" value={time} error={err("time")} onChange={(e) => setTime(e.target.value)} />
        </div>
        <div className="mt-2 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>{t("cancel")}</Button>
          <Button type="submit">{t("submit")}</Button>
        </div>
      </form>
    </Modal>
  );
}