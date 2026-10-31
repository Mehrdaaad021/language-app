"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Plus, Wallet, X } from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { useAppData } from "@/lib/store";
import { createPayment } from "@/lib/server/actions";
import ExportButtons from "@/components/export/ExportButtons";
import { toJalali, toFa } from "@/lib/jalali";
import { SkeletonCard, SkeletonStat } from "@/components/ui/Skeleton";
const inputCls =
  "w-full rounded-xl border border-white/40 bg-white/40 px-4 py-2.5 text-sm font-bold outline-none transition focus:border-[#D94F63]";

function PaymentForm({ onClose, onDone }: { onClose: () => void; onDone: () => Promise<void> }) {
  const tf = useTranslations("Forms");
  const toast = useToast();
  const { data } = useAppData();
  const students = data?.students ?? [];

  const [studentName, setStudentName] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [status, setStatus] = useState<"paid" | "pending">("paid");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName) return toast(tf("errors.required"));
    const amt = Number(amount);
    if (!amt || amt < 10000) return toast(tf("errors.amountTooSmall"));
    if (!date) return toast(tf("errors.required"));

    setSaving(true);
    try {
      await createPayment({ studentName, amount: amt, date, status });
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
        className="glass-strong max-h-[90vh] w-full max-w-md overflow-y-auto rounded-[24px] p-6 shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-extrabold">{tf("newPayment")}</h2>
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
            <label className="mb-1 block text-xs font-extrabold">{tf("amount")}</label>
            <input
              className={inputCls}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={tf("amountPh")}
              inputMode="numeric"
            />
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
            <button type="submit" disabled={saving} className="btn-primary flex-1 rounded-full py-2.5 text-sm font-extrabold shadow-lg transition disabled:opacity-60">
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
  const locale = useLocale();
  const fa = locale === "fa";
  const { data, loading, refresh } = useAppData();
  const [open, setOpen] = useState(false);

  const payments = data?.payments ?? [];
  const fmt = (n: number) => new Intl.NumberFormat(fa ? "fa-IR" : "en-US").format(n);

  const paidSum = payments.filter((p) => p.status === "paid").reduce((a, p) => a + p.amount, 0);
  const pendingSum = payments.filter((p) => p.status === "pending").reduce((a, p) => a + p.amount, 0);

  const dateLabel = (d: string) => {
    if (!fa) return d;
    const [y, m, dd] = d.split("-").map(Number);
    const [jy, jm, jd] = toJalali(y, m, dd);
    return `${toFa(jy)}/${toFa(String(jm).padStart(2, "0"))}/${toFa(String(jd).padStart(2, "0"))}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold md:text-3xl">{title}</h1>
          <p className="mt-1 text-sm text-[var(--c-ink-soft)]">{subtitle}</p>
        </div>
        <div className="flex gap-2">
          <ExportButtons type="payments" />
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="btn-primary flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-extrabold shadow-lg transition"
          >
            <Plus size={16} />
            {t("addPayment")}
          </button>
        </div>
      </div>

      {/* خلاصه‌ی مالی */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-[#f6e7c6] p-5">
          <p className="text-[11px] font-extrabold text-[#7c5a63]">{t("totalIncome")}</p>
          <p className="mt-1 text-2xl font-extrabold text-[#40222c]">
            {fmt(paidSum)} <span className="text-xs">{t("toman")}</span>
          </p>
        </div>
        <div className="rounded-2xl bg-[#fdfbf5] p-5">
          <p className="text-[11px] font-extrabold text-[#7c5a63]">{t("paidSum")}</p>
          <p className="mt-1 text-2xl font-extrabold text-[#40222c]">
            {fmt(paidSum)} <span className="text-xs">{t("toman")}</span>
          </p>
        </div>
        <div className="rounded-2xl bg-[#f8d8e0] p-5">
          <p className="text-[11px] font-extrabold text-[#7c5a63]">{t("pendingSum")}</p>
          <p className="mt-1 text-2xl font-extrabold text-[#40222c]">
            {fmt(pendingSum)} <span className="text-xs">{t("toman")}</span>
          </p>
        </div>
      </div>

            {loading ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <SkeletonStat key={i} />
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </>
      ) : payments.length === 0 ? (
        <EmptyState
          icon={Wallet}
          fa={{
            title: "هنوز پرداختی ثبت نشده",
            hint: "اولین شهریه رو ثبت کن تا وضعیت مالی کلاس روشن بشه.",
          }}
          en={{
            title: "No payments yet",
            hint: "Record your first tuition payment to track finances here.",
          }}
          actionLabel={t("addPayment")}
          onAction={() => setOpen(true)}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {payments.map((p) => (
            <Card key={p.id} hoverable>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-extrabold">{p.studentName}</p>
                  <p className="mt-1 text-lg font-extrabold text-[var(--c-primary)]">
                    {fmt(p.amount)} <span className="text-xs">{t("toman")}</span>
                  </p>
                </div>
                <Badge tone={p.status === "paid" ? "success" : "warn"}>
                  {p.status === "paid" ? t("paid") : t("pending")}
                </Badge>
              </div>
              <p className="mt-3 text-xs font-bold text-[var(--c-ink-soft)]">{dateLabel(p.date)}</p>
            </Card>
          ))}
        </div>
      )}

      {open && <PaymentForm onClose={() => setOpen(false)} onDone={refresh} />}
    </div>
  );
}