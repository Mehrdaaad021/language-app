"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Plus, Wallet, CircleCheck, Clock } from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import { Stagger, StaggerItem } from "@/components/ui/Reveal";
import NewPaymentModal from "@/components/modals/NewPaymentModal";
import { useAppData } from "@/lib/store";
import { formatNumber, formatDate } from "@/lib/format";

export default function PaymentsPage() {
  const t = useTranslations("Pages");
  const locale = useLocale();
  const { payments } = useAppData();
  const [open, setOpen] = useState(false);
    const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams.get("new") === "1") setOpen(true);
  }, [searchParams]);

  const fmt = (n: number) => formatNumber(n, locale);
  const paidSum = payments.filter((p) => p.status === "paid").reduce((a, p) => a + p.amount, 0);
  const pendingSum = payments.filter((p) => p.status === "pending").reduce((a, p) => a + p.amount, 0);

  const SUMMARY = [
    { key: "totalIncome", value: paidSum + pendingSum, icon: Wallet, tint: "bg-[rgba(217,79,99,0.12)] text-[#B23A4C]" },
    { key: "paidSum", value: paidSum, icon: CircleCheck, tint: "bg-[rgba(122,178,146,0.20)] text-[#2F6B4F]" },
    { key: "pendingSum", value: pendingSum, icon: Clock, tint: "bg-[rgba(214,142,60,0.16)] text-[#8A5A22]" },
  ];

  return (
    <Stagger>
      <StaggerItem>
        <PageHeader
          title={t("paymentsTitle")}
          subtitle={t("paymentsSubtitle")}
          action={<Button icon={<Plus size={17} />} onClick={() => setOpen(true)}>{t("addPayment")}</Button>}
        />
      </StaggerItem>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {SUMMARY.map((s) => (
          <StaggerItem key={s.key}>
            <Card hoverable>
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${s.tint}`}>
                <s.icon size={20} />
              </div>
              <p className="mt-4 text-2xl font-extrabold tracking-tight">{fmt(s.value)}</p>
              <p className="mt-1 text-xs font-medium text-[var(--color-ink-soft)]">
                {t(s.key)} · {t("toman")}
              </p>
            </Card>
          </StaggerItem>
        ))}
      </div>

      <StaggerItem className="mt-6">
        <Card>
          <Stagger className="divide-y divide-white/40">
            {payments.map((p) => (
              <StaggerItem key={p.id}>
                <div className="flex flex-wrap items-center justify-between gap-3 py-4 text-sm">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#FFCED8] to-[#FFDDDD] text-sm font-extrabold text-[#8A4A56]">
                      {p.studentName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-bold">{p.studentName}</p>
                      <p className="text-[11px] text-[var(--color-ink-soft)]">{formatDate(p.date, locale)}</p>
                    </div>
                  </div>

                  <span className="font-semibold text-[var(--color-ink-soft)]">
                    {fmt(p.amount)} <span className="text-[11px]">{t("toman")}</span>
                  </span>

                  <Badge tone={p.status === "paid" ? "success" : "warn"}>
                    <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                    {p.status === "paid" ? t("paid") : t("pending")}
                  </Badge>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </Card>
      </StaggerItem>

      <NewPaymentModal open={open} onClose={() => setOpen(false)} />
    </Stagger>
  );
}