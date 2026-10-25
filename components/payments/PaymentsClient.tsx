"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Wallet } from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { useAppData } from "@/lib/store";
import { createPayment } from "@/lib/server/actions";

function fmtNum(n: number): string {
  try {
    return new Intl.NumberFormat("fa-IR").format(n);
  } catch {
    return String(n);
  }
}

const inputCls =
  "w-full rounded-xl border border-white/40 bg-white/40 px-4 py-2.5 text-sm font-bold outline-none transition focus:border-[#D94F63]";

function PaymentForm({
  onClose,
  onDone,
  students,
}: {
  onClose: () => void;
  onDone: () => Promise<void>;
  students: { id: string; name: string }[];
}) {
  const tf = useTranslations("Forms");
  const toast = useToast();
  const [studentName, setStudentName] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [status, setStatus] = useState<"paid" | "pending">("paid");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) return toast(tf("errors.required"));
    const amt = parseInt(amount, 10);
    if (!amt || amt < 10000) return toast(tf("errors.amountTooSmall"));
    if (!date) return toast(tf("errors.required"));

    setSaving(true);
    try {
      await createPayment({ studentName: studentName.trim(), amount: amt, date, status });
      toast(tf("paymentAdded"));
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
        className="glass-strong w-full max-w-md rounded-[24px] p-6 shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 className="mb-5 text-lg font-extrabold">{tf("newPayment")}</h2>
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
            <label className="mb-1 block text-xs font-extrabold">{tf("amount")}</label>
            <input className={inputCls} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={tf("amountPh")} inputMode="numeric" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-extrabold">{tf("date")}</label>
            <input className={inputCls} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-extrabold">{tf("status")}</label>
            <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value as "paid" | "pending")}>
              <option value="paid">{tf("statusPaid")}</option>
              <option value="pending">{tf("statusPending")}</option>
            </select>
          </div>
          <div className="mt-1 flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-full bg-white/30 py-2.5 text-sm font-extrabold transition hover:bg-white/40">
              {tf("cancel")}
            </button>
            <button type="submit" disabled={saving} className="flex-1 rounded-full bg-gradient-to-b from-[#E8697B] to-[#D94F63] py-2.5 text-sm font-extrabold text-white shadow-lg transition hover:brightness-105 disabled:opacity-60">
              {saving ? tf("loading") : tf("submit")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PaymentsClient({ title, subtitle }: { title: string; subtitle: string }) {
  const t = useTranslations("Pages");
  const { data, loading, refresh } = useAppData();
  const [open, setOpen] = useState(false);

  const payments = data?.payments ?? [];
  const students = data?.students ?? [];

  const paidSum = payments.filter((p) => p.status === "paid").reduce((a, p) => a + p.amount, 0);
  const pendingSum = payments.filter((p) => p.status === "pending").reduce((a, p) => a + p.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold md:text-3xl">{title}</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">{subtitle}</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-full bg-gradient-to-b from-[#E8697B] to-[#D94F63] px-5 py-2.5 text-sm font-extrabold text-white shadow-lg transition hover:brightness-105"
        >
          <Wallet size={16} />
          {t("addPayment")}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-xs font-bold text-[var(--color-ink-soft)]">{t("totalIncome")}</p>
          <p className="mt-2 text-2xl font-extrabold">{fmtNum(paidSum + pendingSum)}</p>
        </Card>
        <Card>
          <p className="text-xs font-bold text-[var(--color-ink-soft)]">{t("paidSum")}</p>
          <p className="mt-2 text-2xl font-extrabold text-[#2F6B4F]">{fmtNum(paidSum)}</p>
        </Card>
        <Card>
          <p className="text-xs font-bold text-[var(--color-ink-soft)]">{t("pendingSum")}</p>
          <p className="mt-2 text-2xl font-extrabold text-[#B23A4C]">{fmtNum(pendingSum)}</p>
        </Card>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-white/25" />
          ))}
        </div>
      ) : payments.length === 0 ? (
        <div className="rounded-2xl bg-white/25 p-12 text-center">
          <p className="text-sm text-[var(--color-ink-soft)]">هنوز پرداختی ثبت نشده</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((p) => (
            <Card key={p.id} className="flex items-center justify-between">
              <div>
                <p className="font-extrabold">{p.studentName}</p>
                <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
                  {fmtNum(p.amount)} {t("toman")} — {p.date}
                </p>
              </div>
              <Badge tone={p.status === "paid" ? "success" : "warn"}>
                {p.status === "paid" ? t("paid") : t("pending")}
              </Badge>
            </Card>
          ))}
        </div>
      )}

      {open && <PaymentForm onClose={() => setOpen(false)} onDone={refresh} students={students} />}
    </div>
  );
}