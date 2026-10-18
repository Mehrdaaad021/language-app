"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { z } from "zod";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { TextField, SelectField } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { useAppData } from "@/lib/store";
import { mapZodErrors, toEnDigits } from "@/lib/format";

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

export default function NewStudentModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations("Forms");
  const toast = useToast();
  const { addStudent } = useAppData();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [level, setLevel] = useState("A1");
  const [term, setTerm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const schema = z.object({
    name: z.string().trim().min(1, "required"),
    phone: z.string().transform(toEnDigits).pipe(z.string().regex(/^09\d{9}$/, "invalidPhone")),
    level: z.string().min(1, "required"),
    term: z.string().trim().min(1, "required"),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = schema.safeParse({ name, phone, level, term });
    if (!res.success) {
      setErrors(mapZodErrors(res.error.issues));
      return;
    }
    addStudent({ name: res.data.name, phone: res.data.phone, level, term: res.data.term, active: true });
    toast(t("studentAdded"));
    setName(""); setPhone(""); setLevel("A1"); setTerm(""); setErrors({});
    onClose();
  };

  const err = (k: string) => (errors[k] ? t(`errors.${errors[k]}`) : undefined);

  return (
    <Modal open={open} onClose={onClose} title={t("newStudent")}>
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <TextField label={t("name")} placeholder={t("namePh")} value={name} error={err("name")} onChange={(e) => setName(e.target.value)} />
        <TextField label={t("phone")} placeholder={t("phonePh")} inputMode="numeric" value={phone} error={err("phone")} onChange={(e) => setPhone(e.target.value)} />
        <div className="grid grid-cols-2 gap-4">
          <SelectField label={t("level")} value={level} onChange={(e) => setLevel(e.target.value)}>
            {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
          </SelectField>
          <TextField label={t("term")} placeholder={t("termPh")} value={term} error={err("term")} onChange={(e) => setTerm(e.target.value)} />
        </div>
        <div className="mt-2 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>{t("cancel")}</Button>
          <Button type="submit">{t("submit")}</Button>
        </div>
      </form>
    </Modal>
  );
}