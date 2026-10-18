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

export default function NewPaymentModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations("Forms");
  const toast = useToast();
  const { students, addPayment } = useAppData();

  const [studentName, setStudentName] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<"paid" | "pending">("paid");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const schema = z.object({
    studentName: z.string().min(1, "required"),
    amount: z.string().min(1, "required").refine((s) => Number(toEnDigits(s)) >= 10000, "amountTooSmall"),
    status: z.enum(["paid", "pending"]),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = schema.safeParse({ studentName, amount, status });
    if (!res.success) {
      setErrors(mapZodErrors(res.error.issues));
      return;
    }
    const finalAmount = Number(toEnDigits(res.data.amount));
    addPayment({ studentName, amount: finalAmount, date: new Date().toISOString().slice(0, 10), status });
    toast(t("paymentAdded"));
    setStudentName(""); setAmount(""); setStatus("paid"); setErrors({});
    onClose();
  };

  const err = (k: string) => (errors[k] ? t(`errors.${errors[k]}`) : undefined);

  return (
    <Modal open={open} onClose={onClose} title={t("newPayment")}>
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <SelectField label={t("student")} value={studentName} error={err("studentName")} onChange={(e) => setStudentName(e.target.value)}>
          <option value="">{t("chooseStudent")}</option>
          {students.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
        </SelectField>
        <TextField label={t("amount")} placeholder={t("amountPh")} inputMode="numeric" value={amount} error={err("amount")} onChange={(e) => setAmount(e.target.value)} />
        <SelectField label={t("status")} value={status} onChange={(e) => setStatus(e.target.value as "paid" | "pending")}>
          <option value="paid">{t("statusPaid")}</option>
          <option value="pending">{t("statusPending")}</option>
        </SelectField>
        <div className="mt-2 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>{t("cancel")}</Button>
          <Button type="submit">{t("submit")}</Button>
        </div>
      </form>
    </Modal>
  );
}